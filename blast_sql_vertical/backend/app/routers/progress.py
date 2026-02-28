import time

from fastapi import APIRouter, Depends, HTTPException

from app.models import (
    CourseProgressResponse,
    LessonProgressResponse,
    LessonProgressUpsertRequest,
)
from app.services.auth_service import require_authenticated_user
from app.services.content_loader import load_courses
from app.services.user_db import (
    get_lesson_progress,
    list_progress_for_lessons,
    upsert_lesson_progress,
)

router = APIRouter()


def _lesson_ids_from_course(course: dict) -> list[str]:
    ids: list[str] = []
    for module in course.get("modules", []) or []:
        for lesson in module.get("lessons", []) or []:
            if isinstance(lesson, str):
                ids.append(lesson)
            elif isinstance(lesson, dict) and isinstance(lesson.get("id"), str):
                ids.append(lesson["id"])
    return ids


def _progress_updated_at(progress: dict | None) -> int:
    if not isinstance(progress, dict):
        return 0
    ts = progress.get("updatedAt")
    if isinstance(ts, bool):
        return 0
    if isinstance(ts, (int, float)):
        return int(ts)
    if isinstance(ts, str):
        try:
            return int(ts)
        except Exception:
            return 0
    return 0


def _lesson_completed(progress: dict | None, fallback: bool = False) -> bool:
    if isinstance(progress, dict) and isinstance(progress.get("lessonCompleted"), bool):
        return bool(progress["lessonCompleted"])
    return bool(fallback)


def _serialize_lesson_progress(lesson_id: str, row: dict | None) -> LessonProgressResponse:
    if not row:
        return LessonProgressResponse(
            lesson_id=lesson_id,
            progress={},
            is_completed=False,
            found=False,
        )

    progress = row.get("progress") if isinstance(row.get("progress"), dict) else {}
    is_completed = bool(row.get("is_completed")) or _lesson_completed(progress)
    return LessonProgressResponse(
        lesson_id=lesson_id,
        progress=progress,
        is_completed=is_completed,
        found=True,
    )


@router.get("/lesson/{lesson_id}", response_model=LessonProgressResponse)
def get_progress_lesson(
    lesson_id: str,
    user: dict = Depends(require_authenticated_user),
):
    row = get_lesson_progress(int(user["id"]), lesson_id)
    return _serialize_lesson_progress(lesson_id, row)


@router.put("/lesson/{lesson_id}", response_model=LessonProgressResponse)
def put_progress_lesson(
    lesson_id: str,
    req: LessonProgressUpsertRequest,
    user: dict = Depends(require_authenticated_user),
):
    user_id = int(user["id"])
    current = get_lesson_progress(user_id, lesson_id)

    incoming_progress = req.progress if isinstance(req.progress, dict) else {}
    incoming_progress = {**incoming_progress}
    if _progress_updated_at(incoming_progress) <= 0:
        incoming_progress["updatedAt"] = int(time.time() * 1000)

    incoming_completed = _lesson_completed(incoming_progress, fallback=req.is_completed)
    incoming_progress["lessonCompleted"] = incoming_completed
    incoming_ts = _progress_updated_at(incoming_progress)

    if current:
        current_progress = current.get("progress") if isinstance(current.get("progress"), dict) else {}
        current_ts = _progress_updated_at(current_progress)
        if incoming_ts < current_ts:
            return _serialize_lesson_progress(lesson_id, current)

    row = upsert_lesson_progress(
        user_id=user_id,
        lesson_id=lesson_id,
        progress=incoming_progress,
        is_completed=incoming_completed,
    )
    return _serialize_lesson_progress(lesson_id, row)


@router.get("/course/{course_id}", response_model=CourseProgressResponse)
def get_progress_course(
    course_id: str,
    user: dict = Depends(require_authenticated_user),
):
    courses = load_courses().get("courses", [])
    course = next((item for item in courses if item.get("id") == course_id), None)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    lesson_ids = _lesson_ids_from_course(course)
    rows = list_progress_for_lessons(int(user["id"]), lesson_ids)

    lesson_status: dict[str, bool] = {}
    completed = 0
    for lesson_id in lesson_ids:
        row = rows.get(lesson_id)
        progress = row.get("progress") if row and isinstance(row.get("progress"), dict) else {}
        done = bool(row and row.get("is_completed")) or _lesson_completed(progress)
        lesson_status[lesson_id] = done
        if done:
            completed += 1

    total_lessons = len(lesson_ids)
    remaining_lessons = max(0, total_lessons - completed)
    completion_pct = round((completed / total_lessons) * 100.0, 2) if total_lessons > 0 else 0.0

    return CourseProgressResponse(
        course_id=course_id,
        total_lessons=total_lessons,
        completed_lessons=completed,
        remaining_lessons=remaining_lessons,
        completion_pct=completion_pct,
        lesson_status=lesson_status,
    )
