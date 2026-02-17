from fastapi import APIRouter

from app.services.content_loader import load_courses

router = APIRouter()


@router.get("")
def list_courses():
    return load_courses()
