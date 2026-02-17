import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCourses } from "../api/client";

export default function CoursePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCourses()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading courses...</div>;
  if (error) return <div style={{ color: "#f85149" }}>Error: {error}</div>;
  if (!data?.courses?.length) return <div>No courses found.</div>;

  return (
    <div>
      <h1 style={{ marginBottom: "1.5rem" }}>SQL Basics</h1>
      {data.courses.map((course) =>
        course.modules?.map((mod) => (
          <div key={mod.id} style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "#8b949e", marginBottom: "0.75rem" }}>{mod.title}</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {mod.lessons?.map((L, idx) => {
                const id = typeof L === "string" ? L : L.id;
                const title = typeof L === "object" && L.title ? L.title : id.replace(/^lesson_\d+_/, "").replace(/_/g, " ");
                return (
                  <li key={id} style={{ marginBottom: "0.5rem" }}>
                    <Link to={`/lesson/${id}`} style={{ color: "#58a6ff" }}>
                      {idx + 1}. {title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
