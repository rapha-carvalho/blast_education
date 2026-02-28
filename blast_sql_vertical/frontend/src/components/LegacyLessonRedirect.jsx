import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { getCourses } from "../api/client";
import { resolveLessonKeyToSlug } from "../utils/lessonResolver";

const DEFAULT_COURSE_SLUG = "sql-basico-avancado";

export default function LegacyLessonRedirect() {
  const { lessonId } = useParams();
  const [target, setTarget] = useState(null);

  useEffect(() => {
    if (!lessonId) {
      setTarget(`/cursos/${DEFAULT_COURSE_SLUG}`);
      return;
    }
    getCourses()
      .then((coursesData) => {
        const slug = resolveLessonKeyToSlug(coursesData, DEFAULT_COURSE_SLUG, lessonId);
        if (slug) {
          setTarget(`/cursos/${DEFAULT_COURSE_SLUG}/aulas/${slug}`);
        } else {
          setTarget(`/cursos/${DEFAULT_COURSE_SLUG}`);
        }
      })
      .catch(() => setTarget(`/cursos/${DEFAULT_COURSE_SLUG}`));
  }, [lessonId]);

  if (!target) return <div style={{ padding: "2rem", textAlign: "center" }}>Redirecionando...</div>;
  return <Navigate to={target} replace />;
}
