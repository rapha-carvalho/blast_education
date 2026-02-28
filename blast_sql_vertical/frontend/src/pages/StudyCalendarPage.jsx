import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getCourses, getCourseProgress } from "../api/client";
import StudyCalendarModal from "../components/StudyCalendarModal";
import { useAuth } from "../contexts/AuthContext";

const SLUG_TO_COURSE_ID = { "sql-basico-avancado": "sql-basics" };

export default function StudyCalendarPage() {
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessonStatus, setLessonStatus] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCourses()
      .then((data) => {
        if (cancelled) return;
        const courseId = courseSlug ? SLUG_TO_COURSE_ID[courseSlug] : null;
        const c = (data?.courses ?? []).find((x) => x.id === (courseId || "sql-basics"));
        setCourse(c ?? data?.courses?.[0]);
        if (c && user?.id) {
          return getCourseProgress(c.id).then((p) => {
            if (!cancelled) setLessonStatus(p?.lesson_status ?? {});
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [courseSlug, user?.id]);

  if (loading || !course) {
    return (
      <div style={{ padding: "3rem 2rem", textAlign: "center" }}>
        Carregando...
      </div>
    );
  }

  const backTo = courseSlug ? `/cursos/${courseSlug}` : "/cursos/sql-basico-avancado";

  return (
    <div style={{ padding: "1rem 2rem" }}>
      <Link
        to={backTo}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 0",
          color: "#1a73e8",
          textDecoration: "none",
          fontWeight: 500,
          marginBottom: "1rem",
        }}
      >
        <ArrowLeft size={18} /> Voltar ao curso
      </Link>
      <StudyCalendarModal
        open={true}
        onClose={() => navigate(backTo)}
        courseData={course}
        lessonCompletionMap={lessonStatus}
        courseSlug={courseSlug}
      />
    </div>
  );
}
