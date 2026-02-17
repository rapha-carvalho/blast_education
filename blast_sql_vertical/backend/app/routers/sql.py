from fastapi import APIRouter, HTTPException, Query

from app.models import RunSqlRequest, RunSqlResponse, ValidateRequest, ValidateResponse
from app.services.content_loader import load_lesson
from app.services.sql_engine import execute_query
from app.services.validator import validate

router = APIRouter()


@router.post("/run-sql", response_model=RunSqlResponse)
def run_sql(req: RunSqlRequest):
    result = execute_query(req.session_id, req.query)
    if result[0] is None:
        return RunSqlResponse(success=False, error=result[1])
    cols, rows = result
    return RunSqlResponse(success=True, columns=cols, rows=rows)


@router.post("/validate", response_model=ValidateResponse)
def validate_query(req: ValidateRequest):
    correct, message = validate(req.session_id, req.lesson_id, req.challenge_index, req.query)
    return ValidateResponse(correct=correct, message=message)


@router.get("/hint/{exercise_id}")
def get_hint(exercise_id: str, challenge_index: int = Query(0, ge=0)):
    lesson = load_lesson(exercise_id)
    challenges = _get_challenges(lesson)
    if not challenges or challenge_index < 0 or challenge_index >= len(challenges):
        raise HTTPException(status_code=404, detail="Challenge not found")
    hint = challenges[challenge_index].get("hint", "")
    return {"hint": hint}


@router.get("/solution/{exercise_id}")
def get_solution(exercise_id: str, challenge_index: int = Query(0, ge=0)):
    lesson = load_lesson(exercise_id)
    challenges = _get_challenges(lesson)
    if not challenges or challenge_index < 0 or challenge_index >= len(challenges):
        raise HTTPException(status_code=404, detail="Challenge not found")
    solution = challenges[challenge_index].get("solution", "")
    return {"solution": solution}


def _get_challenges(lesson: dict | None) -> list:
    if not lesson:
        return []
    if "challenges" in lesson:
        return lesson["challenges"]
    if "exercise" in lesson:
        return [lesson["exercise"]]
    return []
