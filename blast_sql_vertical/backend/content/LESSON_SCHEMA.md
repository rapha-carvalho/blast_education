# Lesson JSON Schema (Canonical)

All lesson files must follow this single canonical structure.

## Required fields (all lessons)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique lesson identifier (e.g. `lesson_01_intro_select`) |
| `title` | string | Display title |
| `lesson_type` | `"concept_only"` \| `"interactive_sql"` | Whether the lesson has SQL exercises |
| `objective` | string | Short learning objective |
| `content_markdown` | string | Main body in Markdown |
| `prerequisites` | string[] | Lesson ids that should be completed first |
| `estimated_minutes` | number | Estimated completion time |
| `exercises` | array | Use `[]` for concept-only lessons |

## Optional (all lessons)

| Field | Type | Description |
|-------|------|-------------|
| `dataset_context` | object | Business context; optional for concept-only |
| `dataset_context.business_model` | string | One of: `food_delivery`, `ecommerce`, `saas_subscription`, `mobility`, `core_sql` |
| `dataset_context.tables_used` | string[] | Table names (or schema.table) used in the lesson |
| `dataset_context.scenario` | string | Short scenario description |
| `infographics` | object[] | Optional visual aids |

## Exercise object (`exercises[]`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique exercise identifier within the lesson |
| `title` | string | Challenge title shown in the UI |
| `prompt_markdown` | string | Student-facing prompt, including objective and constraints |
| `starter_query` | string | Initial query in the editor |
| `solution_query` | string | Canonical solution SQL |
| `hint_level_1` | string | First hint |
| `hint_level_2` | string | Stronger hint |
| `validation_type` | `"result_match"` | Result-based validation |
| `expected_result` | array of objects | Deterministic expected rows (column names as keys) |
| `validation` | object | Additional validation behavior |
| `validation.order_matters` | boolean | If `true`, row order must match expected result |
| `success_criteria` | object | Explicit UI criteria |
| `success_criteria.objective` | string | One-line completion objective |
| `success_criteria.expected_columns` | string[] | Expected output columns |
| `success_criteria.notes` | string[] | Additional constraints or checks |

## Concept-only lessons

- `lesson_type`: `"concept_only"`
- `exercises`: `[]`
- `infographics`: optional array of objects:

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Infographic title |
| `visual_description` | string | Description for rendering or alt text |
| `layout` | string | e.g. `"horizontal flow diagram"` |
| `flow` | string | e.g. `"left to right"` |

## Content path convention

Lesson files are stored under:

```
CONTENT_DIR / {course_id_slug} / {module_id_slug} / {lesson_id}.json
```

Slug = id with `-` replaced by `_` (e.g. `sql-basics` → `sql_basics`, `module-1` → `module_1`).

## SQL dialect

- Use ANSI SQL compatible with DuckDB and SQLite.
- Avoid vendor-specific functions (e.g. no BigQuery-specific syntax).
