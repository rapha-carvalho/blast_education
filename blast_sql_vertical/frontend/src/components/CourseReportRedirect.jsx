import { Navigate, useParams } from "react-router-dom";

export default function CourseReportRedirect() {
  const { courseSlug } = useParams();
  const target = courseSlug ? `/cursos/${courseSlug}/resumo` : "/";
  return <Navigate to={target} replace />;
}
