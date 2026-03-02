# Master Challenge PDF Revamp Proposal

## Context
Current implementation lives in:
- `frontend/src/utils/generateMasterChallengePDF.js`
- `frontend/src/utils/masterChallengePrintReport.js`

The report is currently generated with this flow:
1. Build large HTML string in JS.
2. Render off-screen DOM in browser.
3. Rasterize each page with `html2canvas`.
4. Insert page images into `jsPDF`.

## Current Issues (investigated)
1. Fixed 7-page output regardless of available content.
2. Layout is hardcoded with inline styles in one large file (`~865` lines), hard to evolve.
3. PDF output is image-based (raster), not true vector text.
4. Typography/icons/colors are not fully aligned with app UI patterns.
5. Fallback simulated blocks (`[simulado]`) reduce report credibility.
6. Pages with sparse data become visually empty and dated.
7. Font loading depends on runtime network + timeout (`setTimeout(800)`), which is fragile.

Code references:
- `frontend/src/utils/generateMasterChallengePDF.js:168` to `frontend/src/utils/generateMasterChallengePDF.js:200`
- `frontend/src/utils/masterChallengePrintReport.js:828` to `frontend/src/utils/masterChallengePrintReport.js:836`
- `frontend/src/utils/masterChallengePrintReport.js:314`

## Visual Direction (target)
A modern, minimal "big tech" look aligned with current platform:
1. High whitespace discipline, fewer decorative boxes.
2. Strong typographic hierarchy and compact section headers.
3. Neutral canvas + selective blue/green accents only for meaning.
4. Data-first cards with subtle stroke, low shadow, large metric emphasis.
5. Fewer pages with adaptive section inclusion (no empty template pages).
6. Consistent tokenized spacing/radius/typography with product UI.

## Recommended Architecture
Use HTML/CSS as source of truth, then export PDF with Playwright (recommended).

### Why Playwright
1. Vector text in PDF (better quality and smaller files).
2. Better CSS support (paged media, print styles).
3. Deterministic rendering (no screenshot quality tuning).
4. Easier to match real web design system.

### Proposed pipeline
1. Frontend sends report payload (`student`, `kpis`, `charts`, `answers`) to backend endpoint.
2. Backend renders HTML template (SSR or template string).
3. Backend uses Playwright `page.pdf()` with print CSS.
4. Backend returns `application/pdf` stream.

### Fallback mode
Keep existing client pipeline as fallback behind feature flag:
- `pdf_renderer = "legacy_canvas" | "playwright_v2"`

## Proposed Structure
Frontend:
- `frontend/src/reports/masterChallenge/v2/tokens.css`
- `frontend/src/reports/masterChallenge/v2/reportTemplate.js`
- `frontend/src/reports/masterChallenge/v2/sections/*.js`
- `frontend/src/reports/masterChallenge/v2/chartAdapters.js`

Backend (new):
- `backend/app/routers/reports.py`
- `backend/app/services/pdf_service.py`
- optional Node worker or Python Playwright runtime

## Content/Layout Strategy
1. Dynamic sections (render only if data exists).
2. No "empty page" placeholders.
3. Cap page count (target 3-5 pages).
4. Insight blocks should always use user answers; no simulated narrative in final export.
5. Keep appendix optional (SQL snippets only when user opts in).

## Migration Plan
Phase 1 (low risk):
1. Extract current template into modular sections.
2. Introduce design tokens and remove most inline style duplication.
3. Remove simulated insight fallback from final export.

Phase 2 (engine upgrade):
1. Implement backend PDF endpoint with Playwright.
2. Reuse same HTML template source from phase 1.
3. Add feature flag rollout.

Phase 3 (quality):
1. Golden screenshot tests for key sections.
2. PDF visual regression checks.
3. Performance checks (generation latency and file size).

## Acceptance Criteria
1. PDF visually consistent with platform style.
2. No blank/placeholder-heavy pages.
3. Selectable text in PDF.
4. Stable output independent of client device performance.
5. Total generation time under 2.5s for normal payload.

## Optional Enhancements
1. Branded cover variants by course/module.
2. Dark cover + light content mode toggle.
3. Executive one-pager mode (single-page summary).
4. Auto-generated chart captions from metrics.
