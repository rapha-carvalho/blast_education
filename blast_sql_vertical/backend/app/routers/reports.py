from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.models import CheatsheetPdfRequest, MasterChallengePdfRequest
from app.services.pdf_service import (
    PdfServiceError,
    PdfServiceUnavailable,
    render_pdf_from_html,
    safe_pdf_filename,
)

router = APIRouter()


@router.post("/master-challenge/pdf")
async def build_master_challenge_pdf(req: MasterChallengePdfRequest):
    try:
        pdf_bytes = await render_pdf_from_html(req.html)
    except PdfServiceUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except PdfServiceError as exc:
        detail = str(exc)
        status = 400 if "not allowed" in detail.lower() or "empty" in detail.lower() else 500
        raise HTTPException(status_code=status, detail=detail) from exc

    filename = safe_pdf_filename(req.filename)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/cheatsheet/pdf")
async def build_cheatsheet_pdf(req: CheatsheetPdfRequest):
    try:
        pdf_bytes = await render_pdf_from_html(req.html, landscape=True)
    except PdfServiceUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except PdfServiceError as exc:
        detail = str(exc)
        status = 400 if "not allowed" in detail.lower() or "empty" in detail.lower() else 500
        raise HTTPException(status_code=status, detail=detail) from exc

    filename = safe_pdf_filename(req.filename or "Blast_SQL_Cheatsheet")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
