from app.services.content_loader import load_lesson
from app.services.sql_engine import execute_query


def _get_challenges(lesson: dict | None) -> list:
    if not lesson:
        return []
    if "challenges" in lesson:
        return lesson["challenges"]
    if "exercise" in lesson:
        return [lesson["exercise"]]
    return []


def _rows_to_set(rows: list[list]) -> set[tuple]:
    return {tuple(r) for r in rows}


def validate(session_id: str, lesson_id: str, challenge_index: int, user_query: str) -> tuple[bool, str]:
    lesson = load_lesson(lesson_id)
    challenges = _get_challenges(lesson)
    if not challenges:
        return False, "Lesson or challenge not found"
    if challenge_index < 0 or challenge_index >= len(challenges):
        return False, "Challenge not found"

    ex = challenges[challenge_index]
    validation_type = ex.get("validation_type", "result_match")
    validation_query = ex.get("validation_query")

    result = execute_query(session_id, user_query)
    if result[0] is None:
        return False, result[1] or "Execution failed"

    user_cols, user_rows = result[0], result[1]

    if validation_type == "result_match" and validation_query:
        exp_result = execute_query(session_id, validation_query)
        if exp_result[0] is None:
            return False, "Reference query failed"
        exp_cols, exp_rows = exp_result[0], exp_result[1]
        if set(user_cols) != set(exp_cols):
            return False, "Column names do not match the expected result."
        user_set = _rows_to_set(user_rows)
        exp_set = _rows_to_set(exp_rows)
        if user_set == exp_set:
            return True, "Correct!"
        return False, "Your result does not match the expected output."

    if validation_type == "exact_match":
        solution = ex.get("solution")
        if solution:
            sol_result = execute_query(session_id, solution)
            if sol_result[0] is None:
                return False, "Solution query failed"
            sol_rows = sol_result[1]
            if _rows_to_set(user_rows) == _rows_to_set(sol_rows):
                return True, "Correct!"
        return False, "Your result does not match the expected output."

    return False, "Validation not configured for this challenge."
