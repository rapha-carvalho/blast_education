import asyncio
import logging
import re

from app.config import (
    PDF_RENDER_TIMEOUT_MS,
    PLAYWRIGHT_CHROMIUM_ARGS,
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
)

logger = logging.getLogger(__name__)

_PLAYWRIGHT = None
_BROWSER = None
_BROWSER_LOCK = asyncio.Lock()

_SCRIPT_TAG_RE = re.compile(r"<\s*script\b", re.IGNORECASE)
_ON_HANDLER_RE = re.compile(r"\bon[a-z]+\s*=", re.IGNORECASE)


class PdfServiceError(RuntimeError):
    pass


class PdfServiceUnavailable(PdfServiceError):
    pass


def sanitize_html_for_pdf(raw_html: str) -> str:
    html = (raw_html or "").strip()
    if not html:
        raise PdfServiceError("HTML payload is empty")
    # Hard-stop on executable markup. The report does not require JS.
    if _SCRIPT_TAG_RE.search(html):
        raise PdfServiceError("Script tags are not allowed in PDF HTML")
    if _ON_HANDLER_RE.search(html):
        raise PdfServiceError("Inline event handlers are not allowed in PDF HTML")
    return html


def safe_pdf_filename(value: str | None) -> str:
    base = (value or "Blast_EstudoDeCaso").strip()
    if not base:
        base = "Blast_EstudoDeCaso"
    base = re.sub(r"[^A-Za-z0-9._-]+", "_", base).strip("._-")
    if not base:
        base = "Blast_EstudoDeCaso"
    if not base.lower().endswith(".pdf"):
        base = f"{base}.pdf"
    return base[:180]


async def _ensure_browser():
    global _PLAYWRIGHT, _BROWSER
    if _BROWSER and _BROWSER.is_connected():
        return _BROWSER

    async with _BROWSER_LOCK:
        if _BROWSER and _BROWSER.is_connected():
            return _BROWSER

        try:
            from playwright.async_api import async_playwright
        except Exception as exc:
            raise PdfServiceUnavailable(
                "Playwright is not available on backend. Install dependencies and Chromium browser."
            ) from exc

        _PLAYWRIGHT = await async_playwright().start()
        launch_kwargs = {
            "headless": True,
            "args": PLAYWRIGHT_CHROMIUM_ARGS,
        }
        if PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH:
            launch_kwargs["executable_path"] = PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH

        try:
            _BROWSER = await _PLAYWRIGHT.chromium.launch(**launch_kwargs)
        except Exception as exc:
            await _PLAYWRIGHT.stop()
            _PLAYWRIGHT = None
            _BROWSER = None
            raise PdfServiceUnavailable(
                "Failed to launch Chromium. Ensure Playwright browsers are installed."
            ) from exc

        return _BROWSER


async def render_pdf_from_html(html: str, *, landscape: bool = False) -> bytes:
    clean_html = sanitize_html_for_pdf(html)
    browser = await _ensure_browser()
    vw, vh = (1123, 794) if landscape else (794, 1123)
    context = await browser.new_context(
        viewport={"width": vw, "height": vh},
        java_script_enabled=False,
    )
    page = await context.new_page()
    try:
        await page.set_content(
            clean_html,
            wait_until="domcontentloaded",
            timeout=PDF_RENDER_TIMEOUT_MS,
        )
        await page.emulate_media(media="print")
        await page.wait_for_timeout(120)
        pdf_bytes = await page.pdf(
            format="A4",
            landscape=landscape,
            print_background=True,
            prefer_css_page_size=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
        )
        return pdf_bytes
    except PdfServiceError:
        raise
    except Exception as exc:
        logger.exception("Failed to render PDF with Playwright")
        raise PdfServiceError("Failed to render PDF from HTML payload") from exc
    finally:
        await context.close()


async def shutdown_pdf_service() -> None:
    global _PLAYWRIGHT, _BROWSER
    async with _BROWSER_LOCK:
        if _BROWSER:
            try:
                await _BROWSER.close()
            except Exception:
                logger.exception("Failed closing Playwright browser")
        if _PLAYWRIGHT:
            try:
                await _PLAYWRIGHT.stop()
            except Exception:
                logger.exception("Failed stopping Playwright runtime")
        _BROWSER = None
        _PLAYWRIGHT = None
