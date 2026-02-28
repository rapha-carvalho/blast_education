from decimal import Decimal
from datetime import date, datetime

from app.services.content_loader import get_lesson_exercises, load_lesson
from app.services.sql_engine import execute_query


def _normalize_value(v) -> str | int | float | None:
    """Normalize DB/JSON values for comparison (dates, decimals, etc)."""
    if v is None:
        return None
    if isinstance(v, (date, datetime)):
        return v.strftime("%Y-%m-%d")
    if isinstance(v, Decimal):
        return float(v)
    if isinstance(v, (int, float, str)):
        return v
    return str(v)


def _row_dict_to_comparable(row: dict, columns: list) -> tuple:
    if isinstance(row, dict):
        return tuple(_normalize_value(row.get(c)) for c in columns)
    return tuple(row)


def _compare_to_expected_result(
    user_cols: list[str],
    user_rows: list[list],
    expected_result: list[dict],
    *,
    order_matters: bool,
) -> tuple[bool, str]:
    if not expected_result:
        if user_rows:
            return False, "Expected no rows, but your query returned rows."
        return True, "Correct!"

    exp_cols = sorted(expected_result[0].keys())
    if set(user_cols) != set(exp_cols):
        return False, "Column names do not match the expected result."

    user_dicts = [dict(zip(user_cols, row, strict=False)) for row in user_rows]
    user_tuples = [_row_dict_to_comparable(d, exp_cols) for d in user_dicts]
    exp_tuples = [_row_dict_to_comparable(d, exp_cols) for d in expected_result]

    if not order_matters:
        user_tuples.sort()
        exp_tuples.sort()

    if len(user_tuples) != len(exp_tuples):
        return False, "Your result does not match the expected output (row count differs)."
    for u, e in zip(user_tuples, exp_tuples):
        if u != e:
            return False, "Your result does not match the expected output."
    return True, "Correct!"


def validate(session_id: str, lesson_id: str, challenge_index: int, user_query: str) -> tuple[bool, str]:
    lesson = load_lesson(lesson_id)
    exercises = get_lesson_exercises(lesson)
    if not exercises:
        return False, "Lesson or challenge not found"
    if challenge_index < 0 or challenge_index >= len(exercises):
        return False, "Challenge not found"

    ex = exercises[challenge_index]
    validation_type = ex.get("validation_type", "result_match")
    expected_result = ex.get("expected_result")
    validation = ex.get("validation") or {}
    order_matters = bool(validation.get("order_matters", False))

    result = execute_query(session_id, user_query)
    if result[0] is None:
        return False, result[1] or "Execution failed"

    user_cols, user_rows = result[0], result[1]

    if validation_type == "result_match":
        # Strategy 1: compare against pre-computed expected_result list
        if expected_result is not None and isinstance(expected_result, list):
            return _compare_to_expected_result(
                user_cols,
                user_rows,
                expected_result,
                order_matters=order_matters,
            )

        # Strategy 2: run solution_query dynamically and compare outputs
        solution_query = ex.get("solution_query", "").strip()
        if solution_query:
            sol_result = execute_query(session_id, solution_query)
            if sol_result[0] is None:
                # Solution itself fails — fall back to column-only check
                expected_cols = ex.get("success_criteria", {}).get("expected_columns", [])
                if expected_cols and set(user_cols) != set(expected_cols):
                    return False, "Column names do not match the expected result."
                return True, "Correct!"

            sol_cols, sol_rows = sol_result[0], sol_result[1]
            sol_expected = [dict(zip(sol_cols, row, strict=False)) for row in sol_rows]
            return _compare_to_expected_result(
                user_cols,
                user_rows,
                sol_expected,
                order_matters=order_matters,
            )

        # Strategy 3: column-name-only check (last resort)
        expected_cols = ex.get("success_criteria", {}).get("expected_columns", [])
        if expected_cols:
            if set(user_cols) != set(expected_cols):
                return False, "Column names do not match the expected result."
            return True, "Correct!"

        return False, "Validation not configured for this challenge."

    return False, "Validation not configured for this challenge."


def validate_playground(session_id: str, challenge: dict, user_query: str) -> tuple[bool, str]:
    result = execute_query(session_id, user_query)
    if result[0] is None:
        return False, result[1] or "Execution failed"
    user_cols, user_rows = result[0], result[1]

    solution_query = challenge.get("solution_query", "").strip()
    if not solution_query:
        return False, "Solution not found for this challenge."
    
    sol_result = execute_query(session_id, solution_query)
    if sol_result[0] is None:
        return False, "Solution itself failed to execute."
        
    sol_cols, sol_rows = sol_result[0], sol_result[1]
    sol_expected = [dict(zip(sol_cols, row, strict=False)) for row in sol_rows]
    
    return _compare_to_expected_result(
        user_cols,
        user_rows,
        sol_expected,
        order_matters=False,
    )
