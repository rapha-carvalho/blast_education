# Lesson Slug Mapping

## Overview

The platform uses **lesson slugs** in URLs for a human-readable experience, while internally storing and referencing lessons by **lesson keys** (e.g. `lesson_m1_1`).

## URL Structure

- **Course base**: `/cursos/sql-basico-avancado`
- **Lessons**: `/cursos/sql-basico-avancado/aulas/{lessonSlug}`
  - Example: `/cursos/sql-basico-avancado/aulas/o-que-e-sql-e-por-que-isso-importa`
- **Supporting pages**:
  - `/cursos/sql-basico-avancado/cheatsheet`
  - `/cursos/sql-basico-avancado/calendario`
  - `/cursos/sql-basico-avancado/minha-conta`
  - `/cursos/sql-basico-avancado/resumo`
  - `/cursos/sql-basico-avancado/playground`
  - `/cursos/sql-basico-avancado/certificado`
  - `/cursos/sql-basico-avancado/desafio-final` (redirects to `/aulas/desafio-final`)

## Mapping

| Concept | Example | Where Used |
|---------|---------|------------|
| **lesson_key** | `lesson_m1_1` | Progress storage, API calls, content lookup |
| **lesson_slug** | `o-que-e-sql-e-por-que-isso-importa` | URLs, links |
| **lesson_title** | O que é SQL e por que isso importa? | Display |

## Slug Generation

Slugs are derived from lesson titles:

1. Normalize Unicode (NFD), strip accents
2. Lowercase, keep only alphanumeric and spaces
3. Replace spaces/underscores with hyphens
4. Collapse multiple hyphens
5. Ensure uniqueness: on collision append `-2`, `-3`, etc.

**Special case**: `lesson_master_challenge_1` uses explicit slug `desafio-final`.

## Backend

- **`content_loader.py`**: `_title_to_slug()`, `_enrich_courses_with_slugs()`, `resolve_lesson_by_slug()`, `resolve_lesson_key_to_slug()`
- **`courses.json`**: Enriched at runtime with `slug` per lesson; no manual slug edits needed
- **Course slug mapping**: `sql-basico-avancado` → `sql-basics` (content ID)

## Frontend

- **`utils/lessonResolver.js`**: `resolveLessonSlugToKey()`, `resolveLessonKeyToSlug()`, `getFirstLessonSlug()`, `getPrevNextSlugs()`
- Uses `getCourses()` data; no extra API

## Redirects

Old URLs redirect to the new structure:

| Old URL | Redirect |
|---------|----------|
| `/lesson/lesson_m1_1` | `/cursos/sql-basico-avancado/aulas/{resolved-slug}` |
| `/playground` | `/cursos/sql-basico-avancado/playground` |
| `/cheatsheet` | `/cursos/sql-basico-avancado/cheatsheet` |
| `/curso-relatorio/:courseSlug` | `/cursos/:courseSlug/resumo` |

## Progress / Certificate Integrity

Progress storage remains keyed by `lesson_key`. Certificate generation and master challenge unlock logic use lesson keys. Only the URL layer uses slugs.
