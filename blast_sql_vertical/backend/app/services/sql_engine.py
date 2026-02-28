import logging
import re
from pathlib import Path

import duckdb
import sqlparse
from sqlparse.tokens import DML

logger = logging.getLogger(__name__)

from app.config import CONTENT_DIR, MAX_QUERY_LENGTH

_SESSIONS: dict[str, duckdb.DuckDBPyConnection] = {}

FORBIDDEN_KEYWORDS = [
    "DROP", "DELETE", "UPDATE", "INSERT", "CREATE", "ALTER",
    "TRUNCATE", "REPLACE", "GRANT", "REVOKE", "EXECUTE",
    "ATTACH", "DETACH", "COPY", "EXPORT", "IMPORT",
    "PRAGMA", "VACUUM", "ANALYZE", "INTO",
]

# Patterns that may indicate SQL injection attempts
INJECTION_PATTERNS = [
    (r"--", "SQL line comments (--) are not allowed"),
    (r"/\*", "Block comments (/*) are not allowed"),
    (r"\*/", "Block comments (*/) are not allowed"),
    (r"\bINFORMATION_SCHEMA\b", "System catalog access is not allowed"),
    (r"\bpg_catalog\b", "System catalog access is not allowed"),
    (r"\bsqlite_\w+", "System table access is not allowed"),
    (r"\bduckdb_\w+", "System table access is not allowed"),
]


def _get_seed_sql() -> str:
    path = CONTENT_DIR / "seed.sql"
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def _is_safe_select_only(query: str) -> str | None:
    """Use sqlparse to verify the query is a single SELECT statement."""
    try:
        parsed = sqlparse.parse(query.strip())
        if not parsed:
            return "Invalid or empty query"
        if len(parsed) > 1:
            return "Only single statement allowed"
        stmt = parsed[0]
        first_token = stmt.token_first(skip_ws=True, skip_cm=False)
        if first_token is None:
            return "Invalid query"
        if first_token.value.upper() in ("SELECT", "WITH"):
            return None
        return "Only SELECT or WITH statements are allowed"
    except Exception:
        return "Query could not be parsed"


def _validate_query(query: str) -> str | None:
    if len(query) > MAX_QUERY_LENGTH:
        return "Query exceeds maximum length"
    if not query.strip():
        return "Empty query"

    query_upper = query.upper().strip()

    for kw in FORBIDDEN_KEYWORDS:
        if re.search(rf"\b{re.escape(kw)}\b", query_upper):
            return f"Forbidden keyword: {kw}"

    for pattern, msg in INJECTION_PATTERNS:
        if re.search(pattern, query, re.IGNORECASE | re.DOTALL):
            return msg

    statements = [s.strip() for s in re.split(r";\s*", query.strip()) if s.strip()]
    if len(statements) > 1:
        return "Only single statement allowed"

    return _is_safe_select_only(query)


def get_connection(session_id: str) -> duckdb.DuckDBPyConnection:
    if session_id not in _SESSIONS:
        conn = duckdb.connect(":memory:")
        seed = _get_seed_sql()
        if seed:
            for stmt in seed.split(";"):
                stmt = stmt.strip()
                if stmt:
                    try:
                        conn.execute(stmt)
                    except Exception as exc:
                        preview = stmt[:120].replace("\n", " ")
                        logger.error("Seed SQL failed: %s | stmt: %s", exc, preview)
                        raise RuntimeError(f"Seed initialisation failed: {exc}") from exc
        _SESSIONS[session_id] = conn
    return _SESSIONS[session_id]


def execute_query(session_id: str, query: str) -> tuple[list[str], list[list]] | tuple[None, str]:
    err = _validate_query(query)
    if err:
        return None, err
    conn = get_connection(session_id)
    try:
        result = conn.execute(query.strip()).fetchall()
        if result:
            cols = [d[0] for d in conn.description]
            rows = [list(r) for r in result]
            return cols, rows
        cols = [d[0] for d in conn.description] if conn.description else []
        return cols, []
    except Exception as e:
        return None, str(e)


def get_schema_details(session_id: str, schema_name: str) -> list[dict]:
    conn = get_connection(session_id)
    try:
        res = conn.execute(
            "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = ?",
            [schema_name]
        ).fetchall()
        return [{"table": r[0], "column": r[1], "type": r[2]} for r in res]
    except Exception as e:
        logger.error(f"Error fetching schema: {e}")
        return []
