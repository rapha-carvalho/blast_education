from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import admin, account, auth, billing, checkout, courses, lessons, progress, reports, sql
from app.services.auth_service import (
    bootstrap_initial_admin,
    bootstrap_required_users,
    require_authenticated_user,
)
from app.services.billing_service import require_course_access
from app.services.content_loader import initialize_runtime_content
from app.services.pdf_service import shutdown_pdf_service
from app.services.user_db import init_user_db

app = FastAPI(title="Blast SQL Learning Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health() -> JSONResponse:
    return JSONResponse({"status": "ok"})


@app.on_event("startup")
def startup() -> None:
    init_user_db()
    bootstrap_required_users()
    bootstrap_initial_admin()
    initialize_runtime_content()


@app.on_event("shutdown")
async def shutdown() -> None:
    await shutdown_pdf_service()


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(
    account.router,
    prefix="/account",
    tags=["account"],
    dependencies=[Depends(require_authenticated_user)],
)
app.include_router(billing.router, prefix="/billing", tags=["billing"])
app.include_router(checkout.router, prefix="/checkout", tags=["checkout"])
app.include_router(
    courses.router,
    prefix="/courses",
    tags=["courses"],
    dependencies=[Depends(require_authenticated_user)],
)
app.include_router(
    lessons.router,
    prefix="/lesson",
    tags=["lessons"],
    dependencies=[Depends(require_course_access)],
)
app.include_router(
    reports.router,
    prefix="/reports",
    tags=["reports"],
    dependencies=[Depends(require_course_access)],
)
app.include_router(
    progress.router,
    prefix="/progress",
    tags=["progress"],
    dependencies=[Depends(require_course_access)],
)
app.include_router(
    sql.router,
    prefix="",
    tags=["sql"],
    dependencies=[Depends(require_course_access)],
)
