from fastapi import APIRouter, HTTPException

from app.services.content_loader import get_exercise_id, load_lesson

router = APIRouter()


@router.get("/{lesson_id}")
def get_lesson(lesson_id: str):
    lesson = load_lesson(lesson_id)
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson
