from fastapi import APIRouter, HTTPException, Query

from app.models import (
    RunSqlRequest, RunSqlResponse, ValidateRequest, ValidateResponse, ValidatePlaygroundRequest
)
from app.services.content_loader import get_lesson_exercises, load_lesson
from app.services.sql_engine import execute_query, get_schema_details
from app.services.validator import validate, validate_playground
import json
from app.config import CONTENT_DIR

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
    lesson = load_lesson(req.lesson_id)
    exercises = get_lesson_exercises(lesson)
    challenge_count = len(exercises)
    next_challenge_index = None
    if correct and req.challenge_index + 1 < challenge_count:
        next_challenge_index = req.challenge_index + 1
    return ValidateResponse(
        correct=correct,
        message=message,
        next_challenge_index=next_challenge_index,
        challenge_count=challenge_count,
    )


@router.get("/hint/{exercise_id}")
def get_hint(
    exercise_id: str,
    challenge_index: int = Query(0, ge=0),
    level: int = Query(1, ge=1, le=2),
):
    lesson = load_lesson(exercise_id)
    exercises = get_lesson_exercises(lesson)
    if not exercises or challenge_index < 0 or challenge_index >= len(exercises):
        raise HTTPException(status_code=404, detail="Challenge not found")
    ex = exercises[challenge_index]
    hint_level_1 = ex.get("hint_level_1") if isinstance(ex.get("hint_level_1"), str) else ""
    hint_level_2 = ex.get("hint_level_2") if isinstance(ex.get("hint_level_2"), str) else ""
    if level == 2:
        hint = hint_level_2.strip() or hint_level_1.strip()
    else:
        hint = hint_level_1.strip() or hint_level_2.strip()
    if not hint:
        hint = "Releia o enunciado e monte a query em blocos: SELECT, FROM e filtros."
    return {"hint": hint}


@router.get("/solution/{exercise_id}")
def get_solution(exercise_id: str, challenge_index: int = Query(0, ge=0)):
    lesson = load_lesson(exercise_id)
    exercises = get_lesson_exercises(lesson)
    if not exercises or challenge_index < 0 or challenge_index >= len(exercises):
        raise HTTPException(status_code=404, detail="Challenge not found")
    ex = exercises[challenge_index]
    solution = ex.get("solution_query", "")
    return {"solution": solution}


def get_playground_data():
    path = CONTENT_DIR / "playground_challenges.json"
    if not path.exists():
        return {"datasets": [], "challenges": {}}
    return json.loads(path.read_text(encoding="utf-8"))


@router.get("/playground/datasets")
def get_playground_datasets():
    data = get_playground_data()
    return {"datasets": data.get("datasets", [])}


@router.get("/playground/schema/{schema_name}")
def get_playground_schema(schema_name: str, session_id: str = Query(...)):
    schema_details = get_schema_details(session_id, schema_name)
    tables = {}
    for row in schema_details:
        t = row["table"]
        if t not in tables:
            tables[t] = []
        tables[t].append({"name": row["column"], "type": row["type"]})
    return {"tables": [{"name": k, "columns": v} for k, v in tables.items()]}


@router.get("/playground/challenges/{dataset_id}")
def get_playground_challenges(dataset_id: str):
    data = get_playground_data()
    challenges = data.get("challenges", {}).get(dataset_id, [])
    # Strip solution query from response
    for c in challenges:
        c.pop("solution_query", None)
    return {"challenges": challenges}


@router.post("/playground/validate", response_model=ValidateResponse)
def validate_playground_query(req: ValidatePlaygroundRequest):
    data = get_playground_data()
    challenges = data.get("challenges", {}).get(req.dataset_id, [])
    challenge = next((c for c in challenges if c["id"] == req.challenge_id), None)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
        
    correct, message = validate_playground(req.session_id, challenge, req.query)
    
    challenge_index = next((i for i, c in enumerate(challenges) if c["id"] == req.challenge_id), -1)
    next_challenge_index = None
    if correct and challenge_index + 1 < len(challenges):
        next_challenge_index = challenge_index + 1

    return ValidateResponse(
        correct=correct,
        message=message,
        next_challenge_index=next_challenge_index,
        challenge_count=len(challenges)
    )
