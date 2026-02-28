export const PROGRESS_VERSION = 4;
export const LEGACY_PROGRESS_KEY = "sql_lesson_progress";

function progressKeyForUser(userId) {
  const uid = String(userId ?? "anon");
  return `sql_lesson_progress_u_${uid}`;
}

function safeParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeStoreShape(parsed) {
  if (parsed && typeof parsed === "object" && parsed.version === PROGRESS_VERSION && parsed.lessons) {
    return parsed;
  }
  if (parsed && typeof parsed === "object" && parsed.lessons) {
    return { version: PROGRESS_VERSION, lessons: parsed.lessons };
  }
  if (parsed && typeof parsed === "object") {
    return { version: PROGRESS_VERSION, lessons: parsed };
  }
  return { version: PROGRESS_VERSION, lessons: {} };
}

export function getProgressStorageKey(userId) {
  return progressKeyForUser(userId);
}

export function readProgressStore(userId) {
  const userKey = progressKeyForUser(userId);
  const userStore = normalizeStoreShape(safeParse(sessionStorage.getItem(userKey)));
  if (Object.keys(userStore.lessons || {}).length > 0) return userStore;

  const legacyStore = normalizeStoreShape(safeParse(sessionStorage.getItem(LEGACY_PROGRESS_KEY)));
  if (Object.keys(legacyStore.lessons || {}).length === 0) return userStore;

  // One-way migration from legacy key to user-scoped key.
  sessionStorage.setItem(userKey, JSON.stringify(legacyStore));
  return legacyStore;
}

export function writeProgressStore(userId, store) {
  const userKey = progressKeyForUser(userId);
  const normalized = normalizeStoreShape(store);
  normalized.version = PROGRESS_VERSION;
  normalized.lessons = normalized.lessons ?? {};
  sessionStorage.setItem(userKey, JSON.stringify(normalized));
}

export function readAllLessonProgressLocal(userId) {
  return readProgressStore(userId).lessons ?? {};
}

export function readLessonProgressLocal(userId, lessonId) {
  if (!lessonId) return null;
  const lessons = readAllLessonProgressLocal(userId);
  const entry = lessons[lessonId];
  return entry && typeof entry === "object" ? entry : null;
}

export function writeLessonProgressLocal(userId, lessonId, progress) {
  if (!lessonId) return;
  const store = readProgressStore(userId);
  store.version = PROGRESS_VERSION;
  store.lessons = store.lessons ?? {};
  store.lessons[lessonId] = progress && typeof progress === "object" ? progress : {};
  writeProgressStore(userId, store);
}

export function progressUpdatedAt(entry) {
  if (!entry || typeof entry !== "object") return 0;
  const ts = entry.updatedAt;
  if (typeof ts === "number" && Number.isFinite(ts)) return Math.floor(ts);
  if (typeof ts === "string") {
    const parsed = Number(ts);
    if (Number.isFinite(parsed)) return Math.floor(parsed);
  }
  return 0;
}

export function mergeProgressEntries(localEntry, remoteEntry) {
  if (!localEntry && !remoteEntry) return { merged: null, source: "none" };
  if (!localEntry) return { merged: remoteEntry, source: "remote" };
  if (!remoteEntry) return { merged: localEntry, source: "local" };

  const localTs = progressUpdatedAt(localEntry);
  const remoteTs = progressUpdatedAt(remoteEntry);
  if (remoteTs > localTs) return { merged: remoteEntry, source: "remote" };
  if (localTs > remoteTs) return { merged: localEntry, source: "local" };
  return { merged: remoteEntry, source: "remote" };
}

export function lessonIsComplete(progressEntry) {
  if (!progressEntry) return false;
  if (typeof progressEntry.lessonCompleted === "boolean") return progressEntry.lessonCompleted;
  if (Array.isArray(progressEntry)) return progressEntry.length > 0 && progressEntry.every(Boolean);
  if (!Array.isArray(progressEntry.completed) || progressEntry.completed.length === 0) return false;
  return progressEntry.completed.every(Boolean);
}

export function normalizeLessonProgress(raw, challengeCount) {
  const totalChallenges = Math.max(0, Number(challengeCount) || 0);
  const base = {
    currentChallengeIndex: 0,
    completed: Array(totalChallenges).fill(false),
    attemptsByChallenge: {},
    failuresByChallenge: {},
    hintsUsedByChallenge: {},
    hintUnlockedByChallenge: {},
    lastQueryByChallenge: {},
    resultSnapshotByChallenge: {},
    writtenAnswersByTab: {},
    completedWrittenByTab: {},
    rubricByTab: {},
    templateSeededByTab: {},
    lessonCompleted: false,
    updatedAt: 0,
  };

  if (!raw || typeof raw !== "object") return base;

  return {
    ...base,
    currentChallengeIndex: Math.max(
      0,
      Math.min(raw.currentChallengeIndex ?? 0, Math.max(totalChallenges - 1, 0))
    ),
    completed: Array(totalChallenges)
      .fill(false)
      .map((_, idx) => Boolean(raw.completed?.[idx])),
    attemptsByChallenge: raw.attemptsByChallenge ?? {},
    failuresByChallenge: raw.failuresByChallenge ?? {},
    hintsUsedByChallenge: raw.hintsUsedByChallenge ?? {},
    hintUnlockedByChallenge: (() => {
      const explicit = raw.hintUnlockedByChallenge ?? {};
      const failures = raw.failuresByChallenge ?? {};
      const merged = { ...explicit };
      Object.keys(failures).forEach((k) => {
        if ((failures[k] ?? 0) >= 1) merged[k] = true;
      });
      return merged;
    })(),
    lastQueryByChallenge: raw.lastQueryByChallenge ?? {},
    resultSnapshotByChallenge: raw.resultSnapshotByChallenge ?? {},
    writtenAnswersByTab: raw.writtenAnswersByTab ?? {},
    completedWrittenByTab: raw.completedWrittenByTab ?? {},
    rubricByTab: raw.rubricByTab ?? {},
    templateSeededByTab: raw.templateSeededByTab ?? {},
    lessonCompleted: Boolean(raw.lessonCompleted),
    updatedAt: progressUpdatedAt(raw),
  };
}
