const API_BASE = import.meta.env.VITE_API_URL || "/api";
export const AUTH_TOKEN_KEY = "blast_school_token";

export function getStoredToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // Best effort for token persistence.
  }
}

function normalizeApiError(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (typeof payload.message === "string") return payload.message;
  if (typeof payload.detail === "string") return payload.detail;
  if (Array.isArray(payload.detail)) {
    const msg = payload.detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item.msg === "string") return item.msg;
        return null;
      })
      .filter(Boolean)
      .join(" | ");
    if (msg) return msg;
  }
  if (typeof payload.detail === "object" && payload.detail !== null) {
    if (typeof payload.detail.message === "string") return payload.detail.message;
    try {
      return JSON.stringify(payload.detail);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

async function fetchApi(path, options = {}) {
  const { skipAuth = false, ...requestOptions } = options;
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const token = skipAuth ? null : getStoredToken();
  const hasBody = Object.prototype.hasOwnProperty.call(requestOptions, "body");
  const headers = {
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    ...requestOptions.headers,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    ...requestOptions,
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const error = new Error(normalizeApiError(err, res.statusText || "Request failed"));
    error.status = res.status;
    error.payload = err;
    throw error;
  }
  return res.json();
}

export async function getCourses() {
  return fetchApi("/courses");
}

export async function getLesson(lessonId) {
  return fetchApi(`/lesson/${lessonId}`);
}

export async function runSql(sessionId, lessonId, query) {
  return fetchApi("/run-sql", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, lesson_id: lessonId, query }),
  });
}

export async function validateQuery(sessionId, lessonId, challengeIndex, query) {
  return fetchApi("/validate", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      lesson_id: lessonId,
      challenge_index: challengeIndex,
      query,
    }),
  });
}

export async function getHint(exerciseId, challengeIndex = 0, level = 1) {
  return fetchApi(`/hint/${exerciseId}?challenge_index=${challengeIndex}&level=${level}`);
}

export async function getSolution(exerciseId, challengeIndex = 0) {
  return fetchApi(`/solution/${exerciseId}?challenge_index=${challengeIndex}`);
}

export async function registerUser(email, password, fullName = null) {
  return fetchApi("/auth/register", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
}

export async function loginUser(email, password) {
  return fetchApi("/auth/login", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ email, password }),
  });
}

export async function getCurrentUser() {
  return fetchApi("/auth/me");
}

export async function logoutUser() {
  return fetchApi("/auth/logout", { method: "POST" });
}

export async function buildMasterChallengePdf({ html, filename }) {
  const url = `${API_BASE}/reports/master-challenge/pdf`;
  const token = getStoredToken();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ html, filename }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(normalizeApiError(err, res.statusText || "Request failed"));
  }

  return res.blob();
}

export async function buildCheatsheetPdf({ html, filename }) {
  const url = `${API_BASE}/reports/cheatsheet/pdf`;
  const token = getStoredToken();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ html, filename }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(normalizeApiError(err, res.statusText || "Request failed"));
  }

  return res.blob();
}

export async function getPlaygroundDatasets() {
  return fetchApi("/playground/datasets");
}

export async function getPlaygroundSchema(datasetId, sessionId) {
  return fetchApi(`/playground/schema/${datasetId}?session_id=${sessionId}`);
}

export async function getPlaygroundChallenges(datasetId) {
  return fetchApi(`/playground/challenges/${datasetId}`);
}

export async function validatePlaygroundQuery(sessionId, datasetId, challengeId, query) {
  return fetchApi("/playground/validate", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      dataset_id: datasetId,
      challenge_id: challengeId,
      query,
    }),
  });
}

export async function getLessonProgress(lessonId) {
  return fetchApi(`/progress/lesson/${lessonId}`);
}

export async function saveLessonProgress(lessonId, progress, isCompleted = false) {
  return fetchApi(`/progress/lesson/${lessonId}`, {
    method: "PUT",
    body: JSON.stringify({
      progress: progress || {},
      is_completed: Boolean(isCompleted),
    }),
  });
}

export async function getCourseProgress(courseId) {
  return fetchApi(`/progress/course/${courseId}`);
}

export async function createCheckoutSession() {
  return fetchApi("/billing/checkout-session", { method: "POST" });
}

export async function createEmbeddedCheckoutSession(courseId = null) {
  return fetchApi("/billing/embedded-checkout-session", {
    method: "POST",
    body: JSON.stringify({ course_id: courseId }),
  });
}

export async function startCheckout({ email, password, courseId = null }) {
  return fetchApi("/checkout/start", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({
      email,
      password,
      course_id: courseId,
    }),
  });
}

export async function startEmbeddedCheckout({ email, password, courseId = null }) {
  return fetchApi("/checkout/start-embedded", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({
      email,
      password,
      course_id: courseId,
    }),
  });
}

export async function getBillingAccessStatus() {
  return fetchApi("/billing/access-status");
}

export async function getAdminStats() {
  return fetchApi("/admin/stats");
}

export async function getAdminUsers(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return fetchApi(`/admin/users${suffix}`);
}

export async function createAdminUser(payload) {
  return fetchApi("/admin/users", {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

export async function getAdminUserDetail(userId) {
  return fetchApi(`/admin/users/${userId}`);
}

export async function updateAdminUser(userId, payload) {
  return fetchApi(`/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload || {}),
  });
}

export async function refreshAdminUserStripe(userId) {
  return fetchApi(`/admin/users/${userId}/refresh-stripe`, {
    method: "POST",
  });
}

export async function updateAdminUserProgress(userId, payload) {
  return fetchApi(`/admin/users/${userId}/progress`, {
    method: "PATCH",
    body: JSON.stringify(payload || {}),
  });
}

export async function startAdminImpersonation(userId, reason = null) {
  return fetchApi("/admin/impersonate", {
    method: "POST",
    body: JSON.stringify({
      user_id: Number(userId),
      ...(reason ? { reason } : {}),
    }),
  });
}

export async function stopAdminImpersonation() {
  return fetchApi("/admin/impersonate/stop", { method: "POST" });
}

export async function getAccountInfo() {
  return fetchApi("/account");
}

export async function requestRefund({ reason }) {
  return fetchApi("/account/refund", {
    method: "POST",
    body: JSON.stringify({ reason: reason || null }),
  });
}

export async function forgotPassword(email) {
  return fetchApi("/auth/forgot-password", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ email }),
  });
}

export async function validateResetToken(token) {
  const q = token ? `?token=${encodeURIComponent(token)}` : "";
  return fetchApi(`/auth/reset-password/validate${q}`, { skipAuth: true });
}

export async function resetPassword(token, newPassword) {
  return fetchApi("/auth/reset-password", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}

export async function changePassword(currentPassword, newPassword) {
  return fetchApi("/account/change-password", {
    method: "POST",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

export async function sendResetLink() {
  return fetchApi("/account/send-reset-link", { method: "POST" });
}

export async function updateProfile({ full_name }) {
  return fetchApi("/account/profile", {
    method: "PATCH",
    body: JSON.stringify({ full_name }),
  });
}

export async function getCertificatePdf() {
  const url = `${API_BASE}/account/certificate/pdf`;
  const token = getStoredToken();
  const res = await fetch(url, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const code = err?.detail?.code;
    const msg = normalizeApiError(err, res.statusText || "Request failed");
    const e = new Error(msg);
    if (code) e.code = code;
    throw e;
  }
  return res.blob();
}
