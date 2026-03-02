# AI Handoff: Implementation Status

Last updated: 2026-02-20

This document summarizes what has already been implemented (uncommitted working tree state) so another AI agent can continue without re-discovery.

## Scope of this handoff

- Project: `blast_sql_vertical`
- Backend: FastAPI + DuckDB
- Frontend: React + Vite
- Content system: JSON lessons in `backend/content`

## What has been implemented

### 1) Content model migration support (legacy + canonical)

- Lessons now support a canonical schema with:
  - `lesson_type` (`concept_only` or `interactive_sql`)
  - `content_markdown` (in addition to legacy `markdown_content`)
  - `exercise` object for single interactive challenge
  - `expected_result`, `hint_level_1`, `hint_level_2`, `solution_query`
  - optional `dataset_context` and `infographics`
- Backward compatibility is kept in both backend and frontend:
  - Legacy `challenges[]` still works.
  - Legacy `hint`, `solution`, `validation_query` still work.

Reference doc created: `backend/content/LESSON_SCHEMA.md`.

### 2) Lesson loading now works across modules/courses

File: `backend/app/services/content_loader.py`

- `load_lesson()` no longer assumes `sql_basics/module_1`.
- Loader now:
  - finds the course/module containing a lesson id from `courses.json`
  - resolves content path using slug logic (`-` -> `_`)
  - supports optional overrides:
    - `course.content_path`
    - `module.path`
- New helper: `_content_path(course, module)`.

Result: new modules (like `module-2`) can be served without hardcoding paths.

### 3) Validation supports deterministic expected results

File: `backend/app/services/validator.py`

- Added support for `exercise.expected_result` (list of row objects).
- New comparison path:
  - checks column set equality
  - normalizes row values by expected column order
  - compares results order-independently
  - returns specific row-count mismatch message when applicable
- Validation fallback behavior:
  - `result_match`:
    1. use `expected_result` if provided
    2. else use legacy `validation_query`
    3. else return configuration error
  - `exact_match`:
    - accepts legacy `solution` or canonical `solution_query`

### 4) Hint and solution API enhancements

Files:
- `backend/app/routers/sql.py`
- `frontend/src/api/client.js`
- `frontend/src/pages/LessonPage.jsx`

Implemented:

- `GET /hint/{exercise_id}` now accepts `level` query param (`1..2`).
- Hint selection logic:
  - level 2 -> `hint_level_2` when available
  - otherwise level 1 -> `hint_level_1`
  - fallback to legacy `hint`
- `GET /solution/{exercise_id}` now returns `solution` or `solution_query`.
- Frontend tracks per-challenge hint escalation and requests hint level progressively.

### 5) Frontend support for concept-only lessons and canonical exercise shape

Files:
- `frontend/src/pages/LessonPage.jsx`
- `frontend/src/components/LessonContent.jsx`

Implemented:

- Added `normalizeChallenges(lesson)` to map canonical `exercise` into challenge-like structure used by existing UI logic.
- Added concept-only rendering path (`lesson_type === "concept_only"`):
  - shows markdown content
  - renders `infographics`
  - shows navigation to next lesson
  - no SQL editor/challenge UI
- Markdown body now supports both `content_markdown` and `markdown_content`.
- `LessonContent` component now accepts both `markdown` and `contentMarkdown`.

### 6) Course and content expansion

Files:
- `backend/content/courses.json`
- `backend/content/sql_basics/module_1/lesson_00_what_is_sql.json` (new)
- `backend/content/sql_basics/module_1/lesson_02_where.json` (migrated to canonical schema)
- `backend/content/sql_basics/module_2/lesson_01_group_by.json` (new)

Implemented:

- Added a concept lesson at start of Module 1:
  - `lesson_00_what_is_sql`
- Added Module 2 entry:
  - `module-2` with `lesson_01_group_by`
- Updated WHERE lesson to canonical schema and deterministic `expected_result`.

### 7) Seed data expanded for business-model datasets

File: `backend/content/seed.sql`

- Existing legacy `customers/products/orders` data remains for old lessons.
- Added schema-based datasets:
  - `food_delivery`
  - `ecommerce`
  - `saas_subscription`
  - `mobility`

This unblocks writing lessons against domain-specific tables with schema-qualified names.

## Current API surface (relevant paths)

- `GET /courses`
- `GET /lesson/{lesson_id}`
- `POST /run-sql`
- `POST /validate`
- `GET /hint/{exercise_id}?challenge_index=0&level=1|2`
- `GET /solution/{exercise_id}?challenge_index=0`

## Important compatibility rules in current code

- Lessons can be either:
  - legacy: `markdown_content` + `challenges[]`
  - canonical: `content_markdown` + `exercise` (+ optional `infographics`)
- Validation precedence in `result_match`:
  1) `expected_result`
  2) `validation_query`
- Solution/hint fallback supports both old and new keys.

## Known gaps / next work for another agent

1. **Documentation alignment**
- `README.md` still describes old content scope (no module-2, no concept-only/canonical details). Update it.

2. **Test coverage**
- No new automated tests were added for:
  - content loader path resolution
  - expected_result comparator behavior
  - hint level fallback behavior
  - concept-only lesson UI rendering

3. **Potential cleanup**
- `backend/app/__init__.py`, `backend/app/routers/__init__.py`, `backend/app/services/__init__.py` currently only have a blank line change (no functional impact). Decide whether to keep or revert.

4. **Schema consistency migration**
- Other existing lessons may still be in legacy format. Decide whether to fully migrate all content files to canonical schema.

5. **Frontend UX follow-ups**
- No dedicated infographic rendering component yet (currently textual cards).
- Hint level state is in-memory per page state; confirm desired persistence behavior.

## Suggested immediate next tasks

1. Add backend unit tests for `content_loader.py` and `validator.py`.
2. Add frontend tests (or manual QA checklist) for concept-only and interactive branches in `LessonPage`.
3. Update `README.md` to match current architecture/content capabilities.
4. Decide whether to normalize all lessons to canonical schema now or keep dual-format long term.

## Files touched in this implementation batch

- `backend/app/routers/sql.py`
- `backend/app/services/content_loader.py`
- `backend/app/services/validator.py`
- `backend/content/LESSON_SCHEMA.md` (new)
- `backend/content/courses.json`
- `backend/content/seed.sql`
- `backend/content/sql_basics/module_1/lesson_00_what_is_sql.json` (new)
- `backend/content/sql_basics/module_1/lesson_02_where.json`
- `backend/content/sql_basics/module_2/lesson_01_group_by.json` (new)
- `frontend/src/api/client.js`
- `frontend/src/components/LessonContent.jsx`
- `frontend/src/pages/LessonPage.jsx`

