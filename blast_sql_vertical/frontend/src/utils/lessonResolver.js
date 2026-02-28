const SLUG_TO_COURSE_ID = {
  "sql-basico-avancado": "sql-basics",
};

/**
 * Resolve lesson_slug to lesson_key for the given course_slug.
 * @param {object} coursesData - Courses API response { courses: [...] }
 * @param {string} courseSlug - URL course slug (e.g. "sql-basico-avancado")
 * @param {string} lessonSlug - URL lesson slug (e.g. "o-que-e-sql-e-por-que-isso-importa")
 * @returns {string|null} lesson_key (e.g. "lesson_m1_1") or null
 */
export function resolveLessonSlugToKey(coursesData, courseSlug, lessonSlug) {
  if (!coursesData?.courses || !courseSlug || !lessonSlug) return null;
  const courseId = SLUG_TO_COURSE_ID[courseSlug] ?? courseSlug;
  for (const course of coursesData.courses) {
    if (!course?.modules || course.id !== courseId) continue;
    for (const module of course.modules) {
      if (!module?.lessons) continue;
      for (const lesson of module.lessons) {
        const l = typeof lesson === "string" ? { id: lesson } : lesson;
        if (l?.slug === lessonSlug) return l.id ?? null;
      }
    }
  }
  return null;
}

/**
 * Resolve lesson_key to lesson_slug for the given course_slug.
 * @param {object} coursesData - Courses API response { courses: [...] }
 * @param {string} courseSlug - URL course slug (e.g. "sql-basico-avancado")
 * @param {string} lessonKey - Internal lesson key (e.g. "lesson_m1_1")
 * @returns {string|null} lesson_slug or null
 */
export function resolveLessonKeyToSlug(coursesData, courseSlug, lessonKey) {
  if (!coursesData?.courses || !courseSlug || !lessonKey) return null;
  const courseId = SLUG_TO_COURSE_ID[courseSlug] ?? courseSlug;
  for (const course of coursesData.courses) {
    if (!course?.modules || course.id !== courseId) continue;
    for (const module of course.modules) {
      if (!module?.lessons) continue;
      for (const lesson of module.lessons) {
        const l = typeof lesson === "string" ? { id: lesson } : lesson;
        if (l?.id === lessonKey && l?.slug) return l.slug;
      }
    }
  }
  return null;
}

/**
 * Get previous and next lesson slugs for a lesson_key.
 * @param {object} coursesData - Courses API response { courses: [...] }
 * @param {string} courseSlug - URL course slug
 * @param {string} lessonKey - Current lesson key
 * @returns {{ prevLessonSlug: string|null, nextLessonSlug: string|null }}
 */
export function getPrevNextSlugs(coursesData, courseSlug, lessonKey) {
  const result = { prevLessonSlug: null, nextLessonSlug: null };
  if (!coursesData?.courses || !courseSlug || !lessonKey) return result;
  const courseId = SLUG_TO_COURSE_ID[courseSlug] ?? courseSlug;
  const flat = [];
  for (const course of coursesData.courses) {
    if (!course?.modules || course.id !== courseId) continue;
    for (const module of course.modules) {
      if (!module?.lessons) continue;
      for (const lesson of module.lessons) {
        const l = typeof lesson === "string" ? { id: lesson } : lesson;
        flat.push({ key: l?.id ?? lesson, slug: l?.slug ?? null });
      }
    }
    break;
  }
  const idx = flat.findIndex((item) => item.key === lessonKey);
  if (idx < 0) return result;
  if (idx > 0 && flat[idx - 1]?.slug) result.prevLessonSlug = flat[idx - 1].slug;
  if (idx < flat.length - 1 && flat[idx + 1]?.slug) result.nextLessonSlug = flat[idx + 1].slug;
  return result;
}

/**
 * Get the first lesson slug for a course (for "Começar primeira aula" CTA).
 * @param {object} coursesData - Courses API response { courses: [...] }
 * @param {string} courseSlug - URL course slug
 * @returns {string|null} first lesson slug or null
 */
export function getFirstLessonSlug(coursesData, courseSlug) {
  if (!coursesData?.courses || !courseSlug) return null;
  const courseId = SLUG_TO_COURSE_ID[courseSlug] ?? courseSlug;
  for (const course of coursesData.courses) {
    if (!course?.modules || course.id !== courseId) continue;
    for (const module of course.modules) {
      if (!module?.lessons) continue;
      for (const lesson of module.lessons) {
        const l = typeof lesson === "string" ? { id: lesson } : lesson;
        if (l?.slug) return l.slug;
      }
    }
  }
  return null;
}

