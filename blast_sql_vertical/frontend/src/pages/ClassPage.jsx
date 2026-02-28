import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  getCourses,
  getCourseProgress,
  getLesson,
  getLessonProgress,
  saveLessonProgress,
  runSql,
  validateQuery,
  getHint,
  getSolution,
} from "../api/client";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Pencil,
  FileText,
  Check,
  Lock,
  Database,
} from "lucide-react";
import LessonContent from "../components/LessonContent";
import SqlEditor from "../components/SqlEditor";
import ResultTable from "../components/ResultTable";
import ChartResult from "../components/ChartResult";
import SchemaPanel from "../components/SchemaPanel";
import SqlErrorCard from "../components/SqlErrorCard";
import ExerciseActions from "../components/ExerciseActions";
import { fixPtBrText } from "../utils/ptBrText";
import { useAuth } from "../contexts/AuthContext";
import {
  lessonIsComplete,
  mergeProgressEntries,
  normalizeLessonProgress,
  progressUpdatedAt,
  readAllLessonProgressLocal,
  readLessonProgressLocal,
  writeLessonProgressLocal,
} from "../utils/progressStore";
import { resolveLessonSlugToKey, getPrevNextSlugs } from "../utils/lessonResolver";

const MASTER_CHALLENGE_ID = "lesson_master_challenge_1";
const CAPSTONE_FORCE_UNLOCK = true;

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

function getFlatLessonIds(coursesData) {
  const ids = [];
  for (const c of coursesData?.courses || []) {
    for (const m of c.modules || []) {
      for (const l of m.lessons || []) ids.push(typeof l === "string" ? l : l.id);
    }
  }
  return ids;
}

function findCourseIdForLesson(coursesData, lessonId) {
  for (const course of coursesData?.courses || []) {
    for (const module of course.modules || []) {
      for (const lesson of module.lessons || []) {
        const id = typeof lesson === "string" ? lesson : lesson.id;
        if (id === lessonId) return course.id;
      }
    }
  }
  return null;
}


function isMasterLocked(lessonId, coursesData, userId) {
  if (CAPSTONE_FORCE_UNLOCK) return { locked: false, missing: 0 };
  if (lessonId !== MASTER_CHALLENGE_ID) return { locked: false, missing: 0 };
  const lessons = readAllLessonProgressLocal(userId);
  const all = getFlatLessonIds(coursesData).filter((id) => id !== MASTER_CHALLENGE_ID);
  const missing = all.filter((id) => !lessonIsComplete(lessons?.[id])).length;
  return { locked: missing > 0, missing };
}

function tabIcon(type) {
  if (type === "content") return <BookOpen size={14} />;
  if (type === "interpretation") return <FileText size={14} />;
  return <Pencil size={14} />;
}

function evalWritten(tab, answerRaw) {
  const answer = (answerRaw ?? "").trim().toLowerCase();
  const minChars = Number(tab?.min_chars ?? 220);
  const charOk = answer.length >= minChars;
  if (tab?.validation_mode === "min_chars_only") {
    return {
      passed: charOk,
      message: charOk ? "Resposta aprovada." : `Resposta incompleta. Mínimo ${minChars} caracteres.`,
    };
  }
  const groups = Array.isArray(tab?.keyword_groups) ? tab.keyword_groups : [];
  const missing = groups.filter((group) => {
    const options = Array.isArray(group) ? group : [group];
    return !options.some((w) => answer.includes(String(w).toLowerCase()));
  });
  const passed = charOk && missing.length === 0;
  return {
    passed,
    message: passed
      ? "Resposta aprovada."
      : `Resposta incompleta. Mínimo ${minChars} caracteres e termos obrigatórios pendentes: ${missing
        .map((g) => g.join(" ou "))
        .join(" | ")}`,
  };
}

function BackButton({ courseSlug }) {
  const to = courseSlug ? `/cursos/${courseSlug}` : "/cursos/sql-basico-avancado";
  return (
    <Link
      to={to}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.45rem",
        padding: "0.55rem 1.1rem",
        borderRadius: "999px",
        border: "1px solid rgba(0,0,0,0.1)",
        background: "#fff",
        color: "#1a1a1a",
        textDecoration: "none",
        fontSize: "0.9rem",
        marginTop: "1.2rem",
        marginBottom: "1.5rem",
      }}
    >
      <ArrowLeft size={15} /> Voltar para o curso
    </Link>
  );
}

export default function ClassPage() {
  const { courseSlug, lessonSlug } = useParams();
  const sessionId = useSessionId();
  const { user } = useAuth();

  const [lesson, setLesson] = useState(null);
  const [coursesData, setCoursesData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [attemptsByChallenge, setAttemptsByChallenge] = useState({});
  const [failuresByChallenge, setFailuresByChallenge] = useState({});
  const [hintLevelShown, setHintLevelShown] = useState({});
  const [hintUnlockedByChallenge, setHintUnlockedByChallenge] = useState({});
  const [lastQueryByChallenge, setLastQueryByChallenge] = useState({});
  const [resultSnapshotByChallenge, setResultSnapshotByChallenge] = useState({});
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [pendingNextChallenge, setPendingNextChallenge] = useState(null);

  const [writtenAnswersByTab, setWrittenAnswersByTab] = useState({});
  const [completedWrittenByTab, setCompletedWrittenByTab] = useState({});
  const [rubricByTab, setRubricByTab] = useState({});
  const [templateSeededByTab, setTemplateSeededByTab] = useState({});
  const [manualLessonCompleted, setManualLessonCompleted] = useState(false);
  const [progressHydrated, setProgressHydrated] = useState(false);

  // Chart refs: one ref per challenge index, lazily created
  const chartRefs = useRef({});
  const syncTimeoutRef = useRef(null);
  const getChartRef = (idx) => {
    if (!chartRefs.current[idx]) chartRefs.current[idx] = { current: null };
    return chartRefs.current[idx];
  };

  const [query, setQuery] = useState("");
  const [result, setResult] = useState({ columns: null, rows: null, error: null });
  const [feedback, setFeedback] = useState(null);
  const [activeTabId, setActiveTabId] = useState(null);
  const [masterLock, setMasterLock] = useState({ locked: false, missing: 0 });

  const challenges = Array.isArray(lesson?.exercises) ? lesson.exercises : [];
  const hasTabs = Array.isArray(lesson?.tabs) && lesson.tabs.length > 0;
  const activeTab = hasTabs ? lesson.tabs.find((t) => t.id === activeTabId) ?? lesson.tabs[0] : null;
  const interpretationTabs = (lesson?.tabs || []).filter((t) => t.type === "interpretation");
  const isConceptOnlyLesson = lesson?.lesson_type === "concept_only";

  const lesson_key = coursesData && courseSlug && lessonSlug
    ? resolveLessonSlugToKey(coursesData, courseSlug, lessonSlug)
    : null;
  const { prevLessonSlug, nextLessonSlug } = lesson_key && coursesData && courseSlug
    ? getPrevNextSlugs(coursesData, courseSlug, lesson_key)
    : { prevLessonSlug: null, nextLessonSlug: null };

  const allSqlCompleted = challenges.length === 0 || completedChallenges.slice(0, challenges.length).every(Boolean);
  const allWrittenCompleted = interpretationTabs.length === 0 || interpretationTabs.every((t) => completedWrittenByTab[t.id]);
  const allCompletedInteractive = allSqlCompleted && allWrittenCompleted;
  const lessonCompleted = isConceptOnlyLesson ? manualLessonCompleted : allCompletedInteractive;

  const lessonId = lesson?.id ?? (coursesData && courseSlug && lessonSlug ? resolveLessonSlugToKey(coursesData, courseSlug, lessonSlug) : null);

  const queueProgressSync = useCallback(
    (payload) => {
      if (!lessonId) return;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(async () => {
        try {
          await saveLessonProgress(lessonId, payload, Boolean(payload.lessonCompleted));
        } catch (err) {
          console.error("Failed to sync lesson progress:", err);
        }
      }, 800);
    },
    [lessonId]
  );

  const progress = useMemo(
    () => ({
      currentChallengeIndex: currentChallenge,
      completed: completedChallenges,
      attemptsByChallenge,
      failuresByChallenge,
      hintsUsedByChallenge: hintLevelShown,
      hintUnlockedByChallenge,
      lastQueryByChallenge,
      resultSnapshotByChallenge,
      writtenAnswersByTab,
      completedWrittenByTab,
      rubricByTab,
      templateSeededByTab,
      lessonCompleted,
    }),
    [
      currentChallenge,
      completedChallenges,
      attemptsByChallenge,
      failuresByChallenge,
      hintLevelShown,
      hintUnlockedByChallenge,
      lastQueryByChallenge,
      resultSnapshotByChallenge,
      writtenAnswersByTab,
      completedWrittenByTab,
      rubricByTab,
      templateSeededByTab,
      lessonCompleted,
    ]
  );

  useEffect(() => {
    if (!progressHydrated || !user?.id || !lessonId) return;
    const payload = {
      ...progress,
      lessonCompleted: Boolean(lessonCompleted),
      updatedAt: Date.now(),
    };
    writeLessonProgressLocal(user.id, lessonId, payload);
    queueProgressSync(payload);
  }, [lessonId, lessonCompleted, progress, progressHydrated, queueProgressSync, user?.id]);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    };
  }, [lessonId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setProgressHydrated(false);
    getCourses()
      .then((courses) => {
        if (cancelled) return;
        setCoursesData(courses);
        const resolvedKey = resolveLessonSlugToKey(courses, courseSlug, lessonSlug);
        if (!resolvedKey) {
          setLesson(null);
          setLoading(false);
          return;
        }
        return Promise.all([
          getLesson(resolvedKey),
          user?.id ? getLessonProgress(resolvedKey).catch(() => null) : Promise.resolve(null),
        ]).then(([l, remote]) => {
          if (cancelled) return;
          setLesson(l);
          const localProgress = readLessonProgressLocal(user?.id, resolvedKey);
        const remoteProgress = remote?.found
          ? {
            ...(remote.progress || {}),
            lessonCompleted:
              typeof remote.progress?.lessonCompleted === "boolean"
                ? remote.progress.lessonCompleted
                : Boolean(remote.is_completed),
          }
          : null;

        const { merged, source } = mergeProgressEntries(localProgress, remoteProgress);
        const p = normalizeLessonProgress(merged, (l.exercises || []).length);

        if (source === "remote" && remoteProgress && user?.id) {
          writeLessonProgressLocal(user.id, resolvedKey, remoteProgress);
        } else if (source === "local" && localProgress) {
          const localTs = progressUpdatedAt(localProgress);
          const remoteTs = progressUpdatedAt(remoteProgress);
          if (localTs > remoteTs) {
            saveLessonProgress(resolvedKey, localProgress, Boolean(localProgress.lessonCompleted)).catch(() => { });
          }
        }

        setCompletedChallenges(p.completed);
        setAttemptsByChallenge(p.attemptsByChallenge);
        setFailuresByChallenge(p.failuresByChallenge ?? {});
        setHintLevelShown(p.hintsUsedByChallenge);
        setHintUnlockedByChallenge(p.hintUnlockedByChallenge ?? {});
        setLastQueryByChallenge(p.lastQueryByChallenge);
        setResultSnapshotByChallenge(p.resultSnapshotByChallenge);
        setWrittenAnswersByTab(p.writtenAnswersByTab);
        setCompletedWrittenByTab(p.completedWrittenByTab);
        setRubricByTab(p.rubricByTab);
        setTemplateSeededByTab(p.templateSeededByTab);
        setManualLessonCompleted(Boolean(p.lessonCompleted));

        const firstIncomplete = p.completed.findIndex((v) => !v);
        const startIdx = firstIncomplete >= 0 ? firstIncomplete : Math.max((l.exercises || []).length - 1, 0);
        setCurrentChallenge(startIdx);
        setQuery("");
        setActiveTabId(l.tabs?.length ? l.tabs[0].id : null);
        setResult({ columns: null, rows: null, error: null });
        setFeedback(null);
        setPendingNextChallenge(null);

        if (l.requires_full_course_completion || resolvedKey === MASTER_CHALLENGE_ID) {
          const localLock = isMasterLocked(resolvedKey, courses, user?.id);
          setMasterLock(localLock);

          const courseId = findCourseIdForLesson(courses, resolvedKey);
          if (courseId) {
            getCourseProgress(courseId)
              .then((courseProgress) => {
                if (cancelled) return;
                const allLessonIds = getFlatLessonIds(courses);
                const missing = allLessonIds
                  .filter((id) => id !== MASTER_CHALLENGE_ID)
                  .filter((id) => !courseProgress?.lesson_status?.[id]).length;
                setMasterLock({ locked: missing > 0, missing });
              })
              .catch(() => {
                // Keep local fallback lock state if remote progress is unavailable.
              });
          }
        } else {
          setMasterLock({ locked: false, missing: 0 });
        }
        setProgressHydrated(true);
        });
      })
      .catch(() => {
        if (!cancelled) setLesson(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseSlug, lessonSlug, user?.id]);

  const activeInterpretationAnswer = activeTab ? writtenAnswersByTab?.[activeTab.id] ?? "" : "";
  const activeInterpretationTemplateSeeded = activeTab ? Boolean(templateSeededByTab?.[activeTab.id]) : false;

  useEffect(() => {
    if (activeTab?.type !== "interpretation") return;
    const template = typeof activeTab.answer_template === "string" ? activeTab.answer_template : "";
    if (!template.trim()) return;

    if (activeInterpretationTemplateSeeded) return;
    if ((activeInterpretationAnswer ?? "").trim().length > 0) {
      setTemplateSeededByTab((prev) => ({ ...prev, [activeTab.id]: true }));
      return;
    }

    setWrittenAnswersByTab((prev) => ({ ...prev, [activeTab.id]: template }));
    setTemplateSeededByTab((prev) => ({ ...prev, [activeTab.id]: true }));
  }, [
    activeTab?.id,
    activeTab?.type,
    activeTab?.answer_template,
    activeInterpretationAnswer,
    activeInterpretationTemplateSeeded,
  ]);

  const captureChallengeSnapshot = async (challengeIndex, sqlText) => {
    const sql = (sqlText ?? "").trim();
    if (!sql) return;
    const r = await runSql(sessionId, lessonId, sql);
    if (!r?.success) throw new Error(r?.error || "Falha ao capturar evidência.");

    const columns = Array.isArray(r.columns) ? r.columns : [];
    const rows = Array.isArray(r.rows) ? r.rows : [];
    const chartConfig = challenges[challengeIndex]?.chart_config ?? null;
    setResultSnapshotByChallenge((prev) => ({
      ...prev,
      [challengeIndex]: {
        columns,
        rowsPreview: rows.slice(0, 8),
        rowCount: rows.length,
        capturedAt: new Date().toISOString(),
        chartConfig,
        chartImageBase64: null,
      },
    }));
  };

  const captureChartImage = (challengeIndex) => {
    const ref = chartRefs.current[challengeIndex];
    if (!ref?.current) return;
    import("html2canvas").then(({ default: html2canvas }) => {
      html2canvas(ref.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" })
        .then((canvas) => {
          const base64 = canvas.toDataURL("image/png");
          setResultSnapshotByChallenge((prev) => ({
            ...prev,
            [challengeIndex]: { ...prev[challengeIndex], chartImageBase64: base64 },
          }));
        })
        .catch(() => { }); // chart capture is non-critical
    });
  };

  const handleTabSelect = (tabId) => {
    setActiveTabId(tabId);
    const tab = lesson?.tabs?.find((t) => t.id === tabId);
    if (tab?.type === "challenge" && typeof tab.exercise_index === "number") {
      const idx = tab.exercise_index;
      setCurrentChallenge(idx);
      setQuery("");
      setFeedback(null);
      setResult({ columns: null, rows: null, error: null });
      setPendingNextChallenge(null);
    }
  };

  const handleRun = async () => {
    setFeedback(null);
    try {
      const r = await runSql(sessionId, lessonId, query);
      if (r.success) setResult({ columns: r.columns, rows: r.rows, error: null });
      else {
        setResult({ columns: null, rows: null, error: r.error });
        setHintUnlockedByChallenge((prev) => ({ ...prev, [currentChallenge]: true }));
      }
    } catch (e) {
      setResult({ columns: null, rows: null, error: e.message });
      setHintUnlockedByChallenge((prev) => ({ ...prev, [currentChallenge]: true }));
    }
  };

  const handleValidate = async () => {
    setAttemptsByChallenge((prev) => ({ ...prev, [currentChallenge]: (prev[currentChallenge] ?? 0) + 1 }));
    try {
      const r = await validateQuery(sessionId, lessonId, currentChallenge, query);
      if (!r.correct) {
        const nextFailures = (failuresByChallenge[currentChallenge] ?? 0) + 1;
        setFailuresByChallenge((prev) => ({ ...prev, [currentChallenge]: nextFailures }));
        setHintUnlockedByChallenge((prev) => ({ ...prev, [currentChallenge]: true }));
        if (nextFailures === 2) {
          const fallbackHint =
            (challenges[currentChallenge]?.hint_level_1 || challenges[currentChallenge]?.hint_level_2 || "").trim();
          try {
            const hintRes = await getHint(lessonId, currentChallenge, 1);
            setHintLevelShown((prev) => ({ ...prev, [currentChallenge]: 1 }));
            setFeedback({ correct: null, message: hintRes.hint || fallbackHint || "Sem dica." });
          } catch {
            setHintLevelShown((prev) => ({ ...prev, [currentChallenge]: 1 }));
            setFeedback({ correct: null, message: fallbackHint || r.message || "Sem dica." });
          }
        } else {
          setFeedback({ correct: false, message: r.message });
        }
        return;
      }
      const next = [...completedChallenges];
      next[currentChallenge] = true;
      setCompletedChallenges(next);
      try {
        await captureChallengeSnapshot(currentChallenge, query);
      } catch {
        // Validation should still pass even if snapshot capture fails.
      }
      if (challenges[currentChallenge]?.chart_config) {
        setTimeout(() => captureChartImage(currentChallenge), 250);
      }
      const nextIdx = typeof r.next_challenge_index === "number" ? r.next_challenge_index : null;
      if (nextIdx !== null) {
        setPendingNextChallenge(nextIdx);
        const nextTab = lesson?.tabs?.find((t) => t.type === "challenge" && t.exercise_index === nextIdx);
        setFeedback({ correct: true, message: "Correto!", nextTabId: nextTab?.id });
      } else {
        setFeedback({ correct: true, message: "Todos os desafios SQL concluídos." });
      }
    } catch (e) {
      setFeedback({ correct: false, message: e.message });
      setHintUnlockedByChallenge((prev) => ({ ...prev, [currentChallenge]: true }));
    }
  };

  const handleHint = async () => {
    const level = Math.min((hintLevelShown[currentChallenge] ?? 0) + 1, 2);
    setHintLevelShown((prev) => ({ ...prev, [currentChallenge]: level }));
    const fallbackHint =
      level === 2
        ? (challenges[currentChallenge]?.hint_level_2 || challenges[currentChallenge]?.hint_level_1 || "").trim()
        : (challenges[currentChallenge]?.hint_level_1 || challenges[currentChallenge]?.hint_level_2 || "").trim();
    try {
      const r = await getHint(lessonId, currentChallenge, level);
      setFeedback({ correct: null, message: r.hint || fallbackHint || "Sem dica." });
    } catch (e) {
      setFeedback({ correct: null, message: fallbackHint || e.message || "Sem dica." });
    }
  };

  const handleSolution = async () => {
    try {
      const r = await getSolution(lessonId, currentChallenge);
      const val = r.solution || "";
      setQuery(val);
      setLastQueryByChallenge((prev) => ({ ...prev, [currentChallenge]: val }));
      setFeedback({ correct: null, message: "Solução carregada." });
    } catch (e) {
      setFeedback({ correct: null, message: e.message });
    }
  };

  const handleContinue = () => {
    if (typeof pendingNextChallenge !== "number") return;
    const tab = lesson?.tabs?.find((t) => t.type === "challenge" && t.exercise_index === pendingNextChallenge);
    if (tab) {
      handleTabSelect(tab.id);
      return;
    }
    if (!hasTabs && pendingNextChallenge >= 0 && pendingNextChallenge < challenges.length) {
      setCurrentChallenge(pendingNextChallenge);
      setQuery("");
      setResult({ columns: null, rows: null, error: null });
      setFeedback(null);
      setPendingNextChallenge(null);
    }
  };

  const handleValidateWritten = (tab) => {
    const references = Array.isArray(tab?.reference_challenges)
      ? tab.reference_challenges.filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < challenges.length)
      : [];
    const pending = references.filter((idx) => !completedChallenges[idx]);
    if (pending.length > 0) {
      setFeedback({ correct: false, message: "Conclua os desafios referenciados antes de validar esta interpretação." });
      return;
    }
    const answer = writtenAnswersByTab?.[tab.id] ?? "";
    const check = evalWritten(tab, answer);
    setRubricByTab((prev) => ({ ...prev, [tab.id]: check }));
    setCompletedWrittenByTab((prev) => ({ ...prev, [tab.id]: check.passed }));
    setFeedback({ correct: check.passed, message: check.message });
  };



  if (loading) return <div style={{ padding: "3rem" }}>A carregar aula...</div>;
  if (!lesson) {
    if (coursesData && courseSlug && lessonSlug && !resolveLessonSlugToKey(coursesData, courseSlug, lessonSlug)) {
      return <Navigate to={`/cursos/${courseSlug}`} replace />;
    }
    return <div style={{ padding: "3rem" }}>Aula não encontrada.</div>;
  }

  if (masterLock.locked) {
    const backTo = courseSlug ? `/cursos/${courseSlug}` : "/cursos/sql-basico-avancado";
    return (
      <div style={{ maxWidth: "980px", margin: "0 auto", padding: "1rem 2rem 3rem" }}>
        <BackButton courseSlug={courseSlug} />
        <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: "1.5rem" }}>
          <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Lock size={18} /> Master Challenge bloqueado
          </h2>
          <p>Conclua todas as aulas anteriores para liberar este módulo.</p>
          <p>Aulas pendentes: <strong>{masterLock.missing}</strong></p>
          <Link to={backTo}>Voltar para o curso</Link>
        </div>
      </div>
    );
  }

  const showSql = (!hasTabs && challenges.length > 0) || activeTab?.type === "challenge";
  const currentExercise = challenges[currentChallenge];
  const activeTabIndex = hasTabs ? lesson.tabs.findIndex((t) => t.id === activeTabId) : -1;
  const tabFolder = activeTabIndex >= 0 ? `tab_${activeTabIndex + 1}` : "tab_1";
  const interpretationReferenceIndices =
    activeTab?.type === "interpretation" && Array.isArray(activeTab.reference_challenges)
      ? activeTab.reference_challenges.filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < challenges.length)
      : [];
  const pendingInterpretationReferenceIndices = interpretationReferenceIndices.filter((idx) => !completedChallenges[idx]);
  const interpretationBlocked = activeTab?.type === "interpretation" && pendingInterpretationReferenceIndices.length > 0;
  const hasInterpretationTemplate = activeTab?.type === "interpretation" && typeof activeTab.answer_template === "string" && activeTab.answer_template.trim().length > 0;

  return (
    <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "0 2rem 3rem" }}>
      <BackButton courseSlug={courseSlug} />

      <h1 style={{ marginTop: 0 }}>{fixPtBrText(lesson.title)}</h1>
      <p style={{ color: "#5f6368" }}>{lesson.estimated_minutes} min · {lesson.lesson_type === "interactive_sql" ? "Aula interativa com SQL" : "Leitura"}</p>

      {hasTabs && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0.2rem 0 1rem" }}>
          {lesson.tabs.map((tab) => {
            const done =
              (tab.type === "challenge" && typeof tab.exercise_index === "number" && completedChallenges[tab.exercise_index]) ||
              (tab.type === "interpretation" && completedWrittenByTab[tab.id]);
            return (
              <button
                key={tab.id}
                onClick={() => handleTabSelect(tab.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "0.55rem 1rem",
                  borderRadius: 999,
                  border: tab.id === activeTabId ? "2px solid #1a73e8" : "1px solid rgba(0,0,0,0.12)",
                  background: done ? "#e6f4ea" : tab.id === activeTabId ? "#e8f0fe" : "#fff",
                  color: done ? "#137333" : "#1f2937",
                  whiteSpace: "nowrap",
                  fontWeight: 600,
                }}
              >
                {tabIcon(tab.type)} {fixPtBrText(tab.title)} {done ? <Check size={12} /> : null}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: "grid", gap: 18, gridTemplateColumns: showSql ? "1.5fr 1fr" : "1fr" }}>
        <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: "1.4rem" }}>
          {!hasTabs && <LessonContent markdown={fixPtBrText(lesson.content_markdown)} lessonId={lessonId} tabId={tabFolder} />}

          {hasTabs && activeTab?.type === "content" && (
            <>
              {activeTab.id === lesson.tabs[lesson.tabs.length - 1].id && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
                  {lesson.final_pdf_requires_completion && !lessonCompleted ? (
                    <button
                      disabled
                      style={{
                        border: "1px solid rgba(0,0,0,0.15)",
                        background: "#f5f5f5",
                        color: "#8a8a8a",
                        borderRadius: 10,
                        padding: "0.65rem 1rem",
                        fontWeight: 700,
                        cursor: "not-allowed"
                      }}
                    >
                      {fixPtBrText(lesson.final_pdf_button_label) || "Gerar Relatório (Conclua a aula)"}
                    </button>
                  ) : (
                    <Link
                      to={`/relatorio/${lessonId}`}
                      target="_blank"
                      style={{
                        border: "1px solid #4285F4",
                        background: "rgba(66, 133, 244, 0.1)",
                        color: "#4285F4",
                        borderRadius: 10,
                        padding: "0.65rem 1rem",
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "inline-block"
                      }}
                    >
                      {fixPtBrText(lesson.final_pdf_button_label) || "Abrir Relatório"}
                    </Link>
                  )}
                </div>
              )}
              <LessonContent markdown={fixPtBrText(activeTab.content_markdown)} lessonId={lessonId} tabId={tabFolder} />
            </>
          )}

          {isConceptOnlyLesson && (
            <div
              style={{
                marginTop: "1.2rem",
                padding: "0.9rem 1rem",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.08)",
                background: manualLessonCompleted ? "#e6f4ea" : "#f8f9fa",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <div style={{ color: manualLessonCompleted ? "#137333" : "#5f6368", fontWeight: 600 }}>
                {manualLessonCompleted ? "Aula marcada como concluída." : "Marque esta aula quando concluir a leitura."}
              </div>
              <button
                onClick={() => setManualLessonCompleted((prev) => !prev)}
                style={{
                  border: "none",
                  borderRadius: 999,
                  padding: "0.48rem 0.95rem",
                  background: manualLessonCompleted ? "#ffffff" : "#1a73e8",
                  color: manualLessonCompleted ? "#1a1a1a" : "#ffffff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {manualLessonCompleted ? "Marcar como pendente" : "Marcar aula como concluída"}
              </button>
            </div>
          )}

          {hasTabs && activeTab?.type === "challenge" && currentExercise && (
            <>
              {activeTab.intro_markdown && <ReactMarkdown remarkPlugins={[remarkGfm]}>{fixPtBrText(activeTab.intro_markdown)}</ReactMarkdown>}
              <h3 style={{ marginTop: "1rem" }}>{fixPtBrText(currentExercise.title)}</h3>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{fixPtBrText(currentExercise.prompt_markdown ?? "")}</ReactMarkdown>
            </>
          )}

          {hasTabs && activeTab?.type === "interpretation" && (
            <>
              <h3 style={{ marginTop: 0 }}>{fixPtBrText(activeTab.title)}</h3>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{fixPtBrText(activeTab.prompt_markdown ?? "")}</ReactMarkdown>
              {interpretationReferenceIndices.length > 0 && (
                <div style={{ marginTop: 12, marginBottom: 12, padding: "0.8rem 0.95rem", borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", background: "#f8fafc" }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Evidências dos desafios relacionados</div>
                  {interpretationReferenceIndices.map((idx) => {
                    const refExercise = challenges[idx];
                    const refSnapshot = resultSnapshotByChallenge[idx];
                    const refQuery = (lastQueryByChallenge[idx] ?? "").trim();
                    const refTab = lesson?.tabs?.find((t) => t.type === "challenge" && t.exercise_index === idx);
                    const capturedLabel = refSnapshot?.capturedAt ? new Date(refSnapshot.capturedAt).toLocaleString("pt-BR") : null;
                    return (
                      <div key={idx} style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, background: "#fff", padding: "0.75rem", marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <div style={{ fontWeight: 700 }}>
                            Desafio {idx + 1}: {fixPtBrText(refExercise?.title || "Sem título")}
                          </div>
                          <div style={{ fontSize: "0.82rem", color: completedChallenges[idx] ? "#137333" : "#b06000", fontWeight: 700 }}>
                            {completedChallenges[idx] ? "Concluído" : "Pendente"}
                          </div>
                        </div>
                        {refQuery ? (
                          <pre style={{ marginTop: 8, marginBottom: 8, whiteSpace: "pre-wrap", background: "#0b1320", color: "#d7e3ff", borderRadius: 8, padding: "0.6rem", fontSize: "0.8rem" }}>
                            {refQuery}
                          </pre>
                        ) : (
                          <div style={{ marginTop: 8, marginBottom: 8, fontSize: "0.85rem", color: "#5f6368" }}>Nenhuma SQL salva para este desafio.</div>
                        )}

                        {refSnapshot?.columns?.length ? (
                          <>
                            <ResultTable columns={refSnapshot.columns} rows={refSnapshot.rowsPreview || []} error={null} />
                            <div style={{ marginTop: 6, fontSize: "0.8rem", color: "#5f6368" }}>
                              {refSnapshot.rowCount ?? 0} linhas totais | preview de até 8 linhas
                              {capturedLabel ? ` | atualizado em ${capturedLabel}` : ""}
                            </div>
                          </>
                        ) : (
                          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.84rem", color: "#5f6368" }}>Sem snapshot de resultado para referência.</span>
                            <button
                              disabled={!refQuery}
                              onClick={async () => {
                                if (!refQuery) {
                                  setFeedback({ correct: false, message: "Não há SQL salva para atualizar esta evidência." });
                                  return;
                                }
                                try {
                                  await captureChallengeSnapshot(idx, refQuery);
                                  setFeedback({ correct: null, message: `Evidência do desafio ${idx + 1} atualizada.` });
                                } catch (e) {
                                  setFeedback({ correct: false, message: e.message });
                                }
                              }}
                              style={{
                                border: "1px solid rgba(0,0,0,0.15)",
                                background: "#fff",
                                color: "#1a1a1a",
                                borderRadius: 999,
                                padding: "0.3rem 0.75rem",
                                fontWeight: 600,
                                cursor: refQuery ? "pointer" : "not-allowed",
                                opacity: refQuery ? 1 : 0.5,
                              }}
                            >
                              Atualizar evidência
                            </button>
                            {refTab?.id && (
                              <button
                                onClick={() => handleTabSelect(refTab.id)}
                                style={{
                                  border: "none",
                                  background: "#1a73e8",
                                  color: "#fff",
                                  borderRadius: 999,
                                  padding: "0.3rem 0.75rem",
                                  fontWeight: 600,
                                }}
                              >
                                Abrir desafio
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {interpretationBlocked && (
                <div style={{ marginTop: 10, marginBottom: 10, padding: "0.8rem 0.9rem", borderRadius: 10, background: "#fff8e1", border: "1px solid #f4d06f" }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Conclua os desafios referenciados para liberar esta interpretação</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {pendingInterpretationReferenceIndices.map((idx) => {
                      const refExercise = challenges[idx];
                      const refTab = lesson?.tabs?.find((t) => t.type === "challenge" && t.exercise_index === idx);
                      return (
                        <button
                          key={idx}
                          onClick={() => refTab?.id && handleTabSelect(refTab.id)}
                          style={{
                            border: "1px solid rgba(0,0,0,0.15)",
                            background: "#fff",
                            color: "#1a1a1a",
                            borderRadius: 999,
                            padding: "0.35rem 0.8rem",
                            fontWeight: 600,
                          }}
                        >
                          Abrir desafio {idx + 1}: {fixPtBrText(refExercise?.title || "")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <textarea
                rows={10}
                value={writtenAnswersByTab[activeTab.id] ?? ""}
                onChange={(e) => setWrittenAnswersByTab((prev) => ({ ...prev, [activeTab.id]: e.target.value }))}
                disabled={interpretationBlocked}
                style={{
                  width: "100%",
                  border: "1px solid rgba(0,0,0,0.14)",
                  borderRadius: 10,
                  padding: 10,
                  marginTop: 10,
                  background: interpretationBlocked ? "#f5f5f5" : "#fff",
                  color: interpretationBlocked ? "#8a8a8a" : "#1a1a1a",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <small>Caracteres: {(writtenAnswersByTab[activeTab.id] ?? "").trim().length} / mínimo {activeTab.min_chars ?? 220}</small>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {hasInterpretationTemplate && (
                    <button
                      disabled={interpretationBlocked}
                      onClick={() => {
                        if (!activeTab.answer_template) return;
                        const ok = window.confirm("Reaplicar o modelo? Isso vai substituir o texto atual.");
                        if (!ok) return;
                        setWrittenAnswersByTab((prev) => ({ ...prev, [activeTab.id]: activeTab.answer_template }));
                        setTemplateSeededByTab((prev) => ({ ...prev, [activeTab.id]: true }));
                      }}
                      style={{
                        background: "#fff",
                        color: "#1a1a1a",
                        border: "1px solid rgba(0,0,0,0.15)",
                        borderRadius: 999,
                        padding: "0.45rem 0.9rem",
                        fontWeight: 700,
                        cursor: interpretationBlocked ? "not-allowed" : "pointer",
                        opacity: interpretationBlocked ? 0.5 : 1,
                      }}
                    >
                      Reaplicar modelo
                    </button>
                  )}
                  <button
                    disabled={interpretationBlocked}
                    onClick={() => handleValidateWritten(activeTab)}
                    style={{
                      background: "#1a73e8",
                      color: "#fff",
                      border: "none",
                      borderRadius: 999,
                      padding: "0.45rem 0.9rem",
                      fontWeight: 700,
                      cursor: interpretationBlocked ? "not-allowed" : "pointer",
                      opacity: interpretationBlocked ? 0.5 : 1,
                    }}
                  >
                    Validar resposta
                  </button>
                </div>
              </div>
              {rubricByTab[activeTab.id] && (
                <div style={{ marginTop: 10, padding: "0.7rem 0.9rem", borderRadius: 10, background: rubricByTab[activeTab.id].passed ? "#e6f4ea" : "#fff3f0" }}>
                  {fixPtBrText(rubricByTab[activeTab.id].message)}
                </div>
              )}
            </>
          )}

          {hasTabs && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.2rem", paddingTop: "1rem", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
              <button
                disabled={lesson.tabs.findIndex((t) => t.id === activeTabId) <= 0}
                onClick={() => {
                  const idx = lesson.tabs.findIndex((t) => t.id === activeTabId);
                  if (idx > 0) handleTabSelect(lesson.tabs[idx - 1].id);
                }}
                style={{
                  padding: "0.6rem 1.2rem",
                  borderRadius: "999px",
                  border: "1px solid rgba(0,0,0,0.15)",
                  background: "#fff",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  cursor: lesson.tabs.findIndex((t) => t.id === activeTabId) <= 0 ? "not-allowed" : "pointer",
                  opacity: lesson.tabs.findIndex((t) => t.id === activeTabId) <= 0 ? 0.4 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}
              >
                <ArrowLeft size={16} /> Anterior
              </button>
              <button
                disabled={lesson.tabs.findIndex((t) => t.id === activeTabId) >= lesson.tabs.length - 1}
                onClick={() => {
                  const idx = lesson.tabs.findIndex((t) => t.id === activeTabId);
                  if (idx < lesson.tabs.length - 1) handleTabSelect(lesson.tabs[idx + 1].id);
                }}
                style={{
                  padding: "0.6rem 1.2rem",
                  borderRadius: "999px",
                  border: "1px solid rgba(0,0,0,0.15)",
                  background: "#1a73e8",
                  fontWeight: 600,
                  color: "#fff",
                  cursor: lesson.tabs.findIndex((t) => t.id === activeTabId) >= lesson.tabs.length - 1 ? "not-allowed" : "pointer",
                  opacity: lesson.tabs.findIndex((t) => t.id === activeTabId) >= lesson.tabs.length - 1 ? 0.4 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}
              >
                Próximo <ArrowRight size={16} />
              </button>
            </div>
          )}

          {(!hasTabs || activeTabId === lesson.tabs?.[lesson.tabs.length - 1]?.id) && (
            <div style={{ display: "flex", gap: 10, marginTop: "1rem" }}>
              {prevLessonSlug && <Link to={`/cursos/${courseSlug}/aulas/${prevLessonSlug}`}>Aula anterior</Link>}
              {lessonCompleted && nextLessonSlug && <Link to={`/cursos/${courseSlug}/aulas/${nextLessonSlug}`}>Proxima aula</Link>}
              {lessonCompleted && (
                <Link
                  target="_blank"
                  to={`/relatorio/${lessonId}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "0.4rem 1rem",
                    borderRadius: 999,
                    background: lesson?.id === "lesson_master_challenge_1" ? "#1a1a1a" : "#e8f0fe",
                    color: lesson?.id === "lesson_master_challenge_1" ? "#fff" : "#1a73e8",
                    fontWeight: 600,
                    textDecoration: "none",
                    marginLeft: "auto"
                  }}
                >
                  {lesson?.id === "lesson_master_challenge_1" ? "Ver Relatório Executivo" : "Ver Resumo da Aula"}
                </Link>
              )}
            </div>
          )}
        </div>

        {showSql && (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "0.8rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.08)", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Editor SQL</span>
                {lesson?.schema_reference && (
                  <button
                    onClick={() => setSchemaOpen(true)}
                    title="Referência de schema"
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      fontSize: 12, fontWeight: 500, color: "#4b5563",
                      background: "#f3f4f6", border: "1px solid #e5e7eb",
                      borderRadius: 6, padding: "4px 10px", cursor: "pointer",
                    }}
                  >
                    <Database size={13} />
                    Schema
                  </button>
                )}
              </div>
              <div style={{ height: 350 }}>
                <SqlEditor
                  value={query}
                  onChange={(val) => {
                    const next = val ?? "";
                    setQuery(next);
                    setLastQueryByChallenge((prev) => ({ ...prev, [currentChallenge]: next }));
                  }}
                  height="100%"
                />
              </div>
              <div style={{ padding: "0.9rem 1rem", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                <ExerciseActions
                  onRun={handleRun}
                  onValidate={handleValidate}
                  onHint={handleHint}
                  onSolution={handleSolution}
                  onContinue={handleContinue}
                  canContinue={typeof pendingNextChallenge === "number"}
                  showHintButton={true}
                  hintLocked={!hintUnlockedByChallenge[currentChallenge]}
                  solutionLocked={(failuresByChallenge[currentChallenge] ?? 0) < 2}
                />
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "0.8rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.08)", fontWeight: 700 }}>Resultado</div>
              <div style={{ padding: "1rem" }}>
                {(() => {
                  const errorToShow = result?.error ?? (feedback?.correct === false ? feedback.message : null);
                  return (
                    <>
                      {errorToShow && <SqlErrorCard rawError={errorToShow} />}
                      {feedback && !errorToShow && (
                        <div style={{ marginBottom: 10, padding: "0.7rem 0.9rem", borderRadius: 10, background: feedback.correct === true ? "#e6f4ea" : feedback.correct === false ? "#fce8e6" : "#f1f3f4" }}>
                          {fixPtBrText(feedback.message)}
                          {feedback.correct === true && feedback.nextTabId && (
                            <button
                              onClick={() => handleTabSelect(feedback.nextTabId)}
                              style={{ marginLeft: 8, border: "none", background: "#137333", color: "#fff", borderRadius: 999, padding: "0.3rem 0.8rem" }}
                            >
                              Próximo desafio <ArrowRight size={12} />
                            </button>
                          )}
                        </div>
                      )}
                      <ResultTable columns={result.columns} rows={result.rows} error={null} />
                      {currentExercise?.chart_config && result.columns && result.rows && (
                        <ChartResult
                          chartConfig={currentExercise.chart_config}
                          columns={result.columns}
                          rows={result.rows}
                          chartRef={getChartRef(currentChallenge)}
                        />
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {schemaOpen && lesson?.schema_reference && (
          <SchemaPanel
            schemaReference={lesson.schema_reference}
            onClose={() => setSchemaOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
