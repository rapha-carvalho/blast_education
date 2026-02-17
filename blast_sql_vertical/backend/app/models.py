from pydantic import BaseModel, Field


class RunSqlRequest(BaseModel):
    session_id: str
    lesson_id: str
    query: str = Field(..., max_length=10240)


class RunSqlResponse(BaseModel):
    success: bool
    columns: list[str] | None = None
    rows: list[list] | None = None
    error: str | None = None


class ValidateRequest(BaseModel):
    session_id: str
    lesson_id: str
    challenge_index: int = 0
    query: str = Field(..., max_length=10240)


class ValidateResponse(BaseModel):
    correct: bool
    message: str
