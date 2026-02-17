import json
from pathlib import Path

from app.config import CONTENT_DIR


def load_courses() -> dict:
    path = CONTENT_DIR / "courses.json"
    if not path.exists():
        return {"courses": []}
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _lesson_ids(module: dict) -> list[str]:
    lessons = module.get("lessons", [])
    return [L if isinstance(L, str) else L["id"] for L in lessons]


def load_lesson(lesson_id: str) -> dict | None:
    for course in load_courses().get("courses", []):
        for module in course.get("modules", []):
            if lesson_id in _lesson_ids(module):
                break
        else:
            continue
        break
    else:
        return None

    path = CONTENT_DIR / "sql_basics" / "module_1" / f"{lesson_id}.json"
    if not path.exists():
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def get_exercise_id(lesson_id: str) -> str:
    return lesson_id
