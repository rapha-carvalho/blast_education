const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function fetchApi(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || res.statusText);
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

export async function getHint(exerciseId, challengeIndex = 0) {
  return fetchApi(`/hint/${exerciseId}?challenge_index=${challengeIndex}`);
}

export async function getSolution(exerciseId, challengeIndex = 0) {
  return fetchApi(`/solution/${exerciseId}?challenge_index=${challengeIndex}`);
}
