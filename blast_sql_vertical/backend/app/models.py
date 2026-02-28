from typing import Any

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
    next_challenge_index: int | None = None
    challenge_count: int | None = None


class AuthRegisterRequest(BaseModel):
    email: str = Field(..., max_length=254)
    password: str = Field(..., min_length=1, max_length=256)
    full_name: str | None = Field(default=None, max_length=120)


class AuthLoginRequest(BaseModel):
    email: str = Field(..., max_length=254)
    password: str = Field(..., min_length=1, max_length=256)


class AuthUser(BaseModel):
    id: int
    email: str
    full_name: str | None = None
    role: str = "student"
    is_impersonating: bool = False
    impersonation_admin_id: int | None = None
    impersonation_started_at: int | None = None
    impersonation_expires_at: int | None = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUser


class AuthMeResponse(BaseModel):
    user: AuthUser


class MessageResponse(BaseModel):
    message: str


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., max_length=254)


class ForgotPasswordResponse(BaseModel):
    message: str = "If an account exists for this email, we sent a reset link."


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1, max_length=512)
    new_password: str = Field(..., min_length=1, max_length=256)


class ResetPasswordValidateResponse(BaseModel):
    valid: bool


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=256)
    new_password: str = Field(..., min_length=1, max_length=256)


class UpdateProfileRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=120)


class ValidatePlaygroundRequest(BaseModel):
    session_id: str
    dataset_id: str
    challenge_id: str
    query: str = Field(..., max_length=10240)


class MasterChallengePdfRequest(BaseModel):
    html: str = Field(..., min_length=1, max_length=2_000_000)
    filename: str | None = Field(default=None, max_length=180)


class CheatsheetPdfRequest(BaseModel):
    html: str = Field(..., min_length=1, max_length=2_000_000)
    filename: str | None = Field(default=None, max_length=180)


class LessonProgressUpsertRequest(BaseModel):
    progress: dict[str, Any] = Field(default_factory=dict)
    is_completed: bool = False


class LessonProgressResponse(BaseModel):
    lesson_id: str
    progress: dict[str, Any] = Field(default_factory=dict)
    is_completed: bool = False
    found: bool = False


class CourseProgressResponse(BaseModel):
    course_id: str
    total_lessons: int
    completed_lessons: int
    remaining_lessons: int
    completion_pct: float
    lesson_status: dict[str, bool]


class CheckoutSessionResponse(BaseModel):
    session_id: str
    session_url: str
    purchase_id: int


class EmbeddedCheckoutSessionRequest(BaseModel):
    course_id: str | None = Field(default=None, max_length=120)


class EmbeddedCheckoutSessionResponse(BaseModel):
    session_id: str
    client_secret: str
    publishable_key: str
    purchase_id: int


class CheckoutStartRequest(BaseModel):
    email: str = Field(..., max_length=254)
    password: str = Field(..., min_length=1, max_length=256)
    course_id: str | None = Field(default=None, max_length=120)


class CheckoutStartResponse(BaseModel):
    session_id: str
    session_url: str
    checkout_intent_id: str
    expires_at: int


class CheckoutStartEmbeddedResponse(BaseModel):
    session_id: str
    client_secret: str
    publishable_key: str
    checkout_intent_id: str
    expires_at: int


class BillingAccessStatusResponse(BaseModel):
    course_id: str
    has_access: bool
    access_status: str | None = None
    starts_at: int | None = None
    expires_at: int | None = None


class AdminStatsResponse(BaseModel):
    total_users: int
    status_counts: dict[str, int]
    active_last_7d: int
    active_last_30d: int
    expirations_next_7d: int
    expirations_next_14d: int
    expirations_next_30d: int


class AdminUserListItem(BaseModel):
    id: int
    full_name: str | None = None
    email: str
    created_at: int
    last_login_at: int | None = None
    access_status: str
    effective_access_status: str
    expires_at: int | None = None
    progress_pct: float
    completed_lessons: int
    total_lessons: int
    stripe_customer_id: str | None = None
    stripe_payment_intent_id: str | None = None
    stripe_checkout_session_id: str | None = None
    latest_purchase_status: str | None = None


class AdminUsersResponse(BaseModel):
    items: list[AdminUserListItem]
    page: int
    page_size: int
    total_items: int
    total_pages: int


class AdminUserProfileResponse(BaseModel):
    id: int
    full_name: str | None = None
    email: str
    role: str
    created_at: int
    last_login_at: int | None = None


class AdminUserAccessResponse(BaseModel):
    status: str
    effective_status: str
    expires_at: int | None = None
    access_managed_by: str
    access_updated_at: int | None = None
    has_access: bool


class AdminUserPaymentResponse(BaseModel):
    latest_purchase_status: str | None = None
    latest_paid_at: int | None = None
    latest_refunded_at: int | None = None
    refunded: bool
    stripe_customer_id: str | None = None
    stripe_payment_intent_id: str | None = None
    stripe_checkout_session_id: str | None = None
    purchase_id: int | None = None


class AdminUserProgressModule(BaseModel):
    module_id: str
    module_title: str
    total_lessons: int
    completed_lessons: int
    completion_pct: float
    lessons: list[dict[str, Any]]


class AdminUserProgressResponse(BaseModel):
    total_lessons: int
    completed_lessons: int
    completion_pct: float
    modules: list[AdminUserProgressModule]


class AdminUserActivityResponse(BaseModel):
    last_login_at: int | None = None
    sessions: list[dict[str, Any]]


class AdminUserAuditEntry(BaseModel):
    id: int
    admin_id: int
    target_user_id: int
    action_type: str
    reason: str
    before: dict[str, Any] = Field(default_factory=dict)
    after: dict[str, Any] = Field(default_factory=dict)
    created_at: int


class AdminUserDetailResponse(BaseModel):
    profile: AdminUserProfileResponse
    access: AdminUserAccessResponse
    payment: AdminUserPaymentResponse
    progress: AdminUserProgressResponse
    activity: AdminUserActivityResponse
    audit_logs: list[AdminUserAuditEntry]


class AdminUserUpdateRequest(BaseModel):
    status: str | None = None
    expires_at: int | None = None
    extend_days: int | None = None
    reason: str = Field(..., min_length=1, max_length=600)


class AdminCreateUserRequest(BaseModel):
    email: str = Field(..., max_length=254)
    full_name: str | None = Field(default=None, max_length=120)
    temporary_password: str = Field(..., min_length=1, max_length=256)
    access_status: str | None = Field(default="expired", max_length=40)
    expires_at: int | None = None
    expires_in_days: int | None = Field(default=None, ge=1, le=3650)
    expires_in_months: int | None = Field(default=None, ge=1, le=120)
    overall_percent: float | None = Field(default=None, ge=0, le=100)
    completed_lesson_ids: list[str] | None = None
    reason: str | None = Field(default=None, max_length=600)


class AdminUserProgressUpdateRequest(BaseModel):
    reason: str = Field(..., min_length=1, max_length=600)
    overall_percent: float | None = Field(default=None, ge=0, le=100)
    completed_lesson_ids: list[str] | None = None


class AdminImpersonateRequest(BaseModel):
    user_id: int = Field(..., ge=1)
    reason: str | None = Field(default=None, max_length=600)


class AdminImpersonateResponse(BaseModel):
    impersonation_access_token: str
    token_type: str = "bearer"
    expires_at: int
    redirect_to: str
    impersonated_user: AuthUser


class AdminStopImpersonationResponse(BaseModel):
    admin_access_token: str
    token_type: str = "bearer"
    redirect_to: str


class AdminUserRefreshStripeResponse(BaseModel):
    user_id: int
    override_preserved: bool
    access_status: str
    effective_access_status: str
    expires_at: int | None = None


class AccountAccessInfo(BaseModel):
    status: str  # active | expired | refunded
    status_label: str
    expires_at: int | None = None
    purchase_at: int | None = None
    refunded_at: int | None = None
    course_id: str
    amount: int | None = None
    currency: str | None = None


class AccountResponse(BaseModel):
    user: AuthUser
    access: AccountAccessInfo | None = None
    eligible_for_refund: bool
    refund_window_days: int


class RefundRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=1000)
