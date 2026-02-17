import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getCourses,
  getLesson,
  runSql,
  validateQuery,
  getHint,
  getSolution,
} from "../api/client";
import LessonContent from "../components/LessonContent";
import SqlEditor from "../components/SqlEditor";
import ResultTable from "../components/ResultTable";
import ExerciseActions from "../components/ExerciseActions";

const PROGRESS_KEY = "sql_lesson_progress";

function useSessionId() {
  const [sid] = useState(() => {
    let s = sessionStorage.getItem("sql_session_id");
    if (!s) {
      s = crypto.randomUUID();
      sessionStorage.setItem("sql_session_id", s);
    }
    return s;
  });
  return sid;
}

function getLessonProgress(lessonId) {
  try {
    const raw = sessionStorage.getItem(PROGRESS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return data[lessonId] || [false, false, false];
  } catch {
    return [false, false, false];
  }
}

function setLessonProgress(lessonId, completed) {
  try {
    const raw = sessionStorage.getItem(PROGRESS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data[lessonId] = completed;
    sessionStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  } catch {}
}

function getFlatLessonIds(coursesData) {
  const ids = [];
  for (const course of coursesData?.courses || []) {
    for (const mod of course.modules || []) {
      for (const L of mod.lessons || []) {
        ids.push(typeof L === "string" ? L : L.id);
      }
    }
  }
  return ids;
}

function getNextLessonId(lessonId, coursesData) {
  const ids = getFlatLessonIds(coursesData);
  const i = ids.indexOf(lessonId);
  return i >= 0 && i < ids.length - 1 ? ids[i + 1] : null;
}

export default function LessonPage() {
  const { lessonId } = useParams();
  const sessionId = useSessionId();
  const [lesson, setLesson] = useState(null);
  const [coursesData, setCoursesData] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState(() => getLessonProgress(lessonId));
  const [query, setQuery] = useState("");
  const [result, setResult] = useState({ columns: null, rows: null, error: null });
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  const challenges = lesson?.challenges || [];
  const allCompleted = challenges.length > 0 && completedChallenges.slice(0, challenges.length).every(Boolean);
  const nextLessonId = getNextLessonId(lessonId, coursesData);

  useEffect(() => {
    Promise.all([getLesson(lessonId), getCourses()])
      .then(([l, courses]) => {
        setLesson(l);
        setCoursesData(courses);
        const progress = getLessonProgress(lessonId);
        setCompletedChallenges(progress);

        const ch = l?.challenges || [];
        let idx = 0;
        for (let i = 0; i < ch.length; i++) {
          if (!progress[i]) {
            idx = i;
            break;
          }
          idx = i + 1;
        }
        setCurrentChallenge(Math.min(idx, ch.length ? ch.length - 1 : 0));
        const starter = ch[idx]?.starter_query ?? ch[0]?.starter_query ?? "";
        setQuery(starter);
      })
      .catch(() => setLesson(null))
      .finally(() => setLoading(false));
  }, [lessonId]);

  useEffect(() => {
    setCompletedChallenges(getLessonProgress(lessonId));
  }, [lessonId]);

  const handleRun = async () => {
    setFeedback(null);
    setResult({ columns: null, rows: null, error: null });
    try {
      const r = await runSql(sessionId, lessonId, query);
      if (r.success) setResult({ columns: r.columns, rows: r.rows, error: null });
      else setResult({ columns: null, rows: null, error: r.error });
    } catch (e) {
      setResult({ columns: null, rows: null, error: e.message });
    }
  };

  const handleValidate = async () => {
    setFeedback(null);
    try {
      const r = await validateQuery(sessionId, lessonId, currentChallenge, query);
      setFeedback({ correct: r.correct, message: r.message });
      if (r.correct && challenges[currentChallenge]) {
        const next = [...completedChallenges];
        next[currentChallenge] = true;
        setCompletedChallenges(next);
        setLessonProgress(lessonId, next);
        const nextIdx = currentChallenge + 1;
        if (nextIdx < challenges.length) {
          setCurrentChallenge(nextIdx);
          setQuery(challenges[nextIdx].starter_query || "");
          setFeedback({ correct: true, message: "Correct! Next challenge unlocked." });
        }
      }
    } catch (e) {
      setFeedback({ correct: false, message: e.message });
    }
  };

  const handleHint = async () => {
    setFeedback(null);
    try {
      const r = await getHint(lessonId, currentChallenge);
      setFeedback({ correct: null, message: r.hint || "No hint available." });
    } catch (e) {
      setFeedback({ correct: null, message: e.message });
    }
  };

  const handleSolution = async () => {
    setFeedback(null);
    try {
      const r = await getSolution(lessonId, currentChallenge);
      setQuery(r.solution || "");
      setFeedback({ correct: null, message: "Solution loaded into editor." });
    } catch (e) {
      setFeedback({ correct: null, message: e.message });
    }
  };

  const goToChallenge = (idx) => {
    if (idx === 0 || completedChallenges[idx - 1]) {
      setCurrentChallenge(idx);
      setQuery(challenges[idx]?.starter_query ?? "");
      setFeedback(null);
    }
  };

  if (loading) return <div>Loading lesson...</div>;
  if (!lesson) return <div style={{ color: "#f85149" }}>Lesson not found.</div>;

  return (
    <div>
      <Link to="/" style={{ color: "#8b949e", fontSize: "0.875rem", marginBottom: "1rem", display: "inline-block" }}>
        ← Back to course
      </Link>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          minHeight: "calc(100vh - 100px)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <h1 style={{ marginBottom: "0.5rem" }}>{lesson.title}</h1>
          <div style={{ flex: 1, minHeight: 200 }}>
            <LessonContent markdown={lesson.markdown_content} />
          </div>
          {challenges.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <h3 style={{ marginBottom: "0.5rem" }}>Challenges</h3>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                {challenges.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToChallenge(idx)}
                    disabled={idx > 0 && !completedChallenges[idx - 1]}
                    style={{
                      padding: "0.35rem 0.75rem",
                      borderRadius: "6px",
                      border: currentChallenge === idx ? "2px solid #58a6ff" : "1px solid #30363d",
                      background: completedChallenges[idx] ? "#238636" : currentChallenge === idx ? "#21262d" : "#161b22",
                      color: idx > 0 && !completedChallenges[idx - 1] ? "#484f58" : "#e6edf3",
                      cursor: idx > 0 && !completedChallenges[idx - 1] ? "not-allowed" : "pointer",
                    }}
                  >
                    {idx + 1} {completedChallenges[idx] ? "✓" : ""}
                  </button>
                ))}
              </div>
              <p style={{ color: "#8b949e" }}>{challenges[currentChallenge]?.instructions}</p>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <h3 style={{ marginBottom: "0.5rem" }}>SQL Editor</h3>
          <SqlEditor value={query} onChange={(v) => setQuery(v ?? "")} height={160} />
          <ExerciseActions
            onRun={handleRun}
            onValidate={handleValidate}
            onHint={handleHint}
            onSolution={handleSolution}
          />
          {feedback && (
            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                borderRadius: "6px",
                background: feedback.correct === true ? "#1a3d2e" : feedback.correct === false ? "#3d1f1f" : "#161b22",
                border: `1px solid ${feedback.correct === true ? "#238636" : feedback.correct === false ? "#f85149" : "#30363d"}`,
                color: feedback.correct === true ? "#3fb950" : feedback.correct === false ? "#f85149" : "#8b949e",
              }}
            >
              {feedback.message}
            </div>
          )}
          {allCompleted && nextLessonId && (
            <div style={{ marginTop: "1rem" }}>
              <Link
                to={`/lesson/${nextLessonId}`}
                style={{
                  display: "inline-block",
                  padding: "0.6rem 1.2rem",
                  background: "#238636",
                  color: "#fff",
                  borderRadius: "6px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Next Lesson →
              </Link>
            </div>
          )}
          {allCompleted && !nextLessonId && (
            <div style={{ marginTop: "1rem", color: "#3fb950" }}>
              All challenges completed! <Link to="/">Back to course</Link>
            </div>
          )}
          <div style={{ marginTop: "1rem", flex: 1, minHeight: 120 }}>
            <h4 style={{ marginBottom: "0.5rem" }}>Result</h4>
            <ResultTable columns={result.columns} rows={result.rows} error={result.error} />
          </div>
        </div>
      </div>
    </div>
  );
}
