from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import courses, lessons, sql

app = FastAPI(title="Blast SQL Learning Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(courses.router, prefix="/courses", tags=["courses"])
app.include_router(lessons.router, prefix="/lesson", tags=["lessons"])
app.include_router(sql.router, prefix="", tags=["sql"])
