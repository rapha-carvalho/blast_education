/**
 * StudyCalendarModal.jsx
 * Full-screen study calendar modal: week-by-week schedule, PDF + ICS export.
 */

import { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Download, AlertTriangle, Clock, BookOpen } from "lucide-react";
import { fixPtBrText } from "../utils/ptBrText";
import { generateSchedule, nextMonday, toInputDate } from "../utils/scheduleGenerator";
import { generateICS, downloadICS } from "../utils/icsExporter";
import { uiTokens } from "../styles/uiTokens";
import { jsPDF } from "jspdf";

// Color palette for 11 modules
const MODULE_COLORS = [
  "#4285F4", "#EA4335", "#FBBC04", "#34A853", "#FF6D00",
  "#46BDC6", "#9C27B0", "#C62828", "#00897B", "#558B2F", "#F06292",
];

function getModuleColor(moduleId, allModules) {
  const idx = allModules.findIndex((m) => m.id === moduleId);
  return MODULE_COLORS[idx % MODULE_COLORS.length] ?? "#4285F4";
}

let whiteBrandIconPromise = null;

async function loadWhiteBrandIcon() {
  if (whiteBrandIconPromise) return whiteBrandIconPromise;

  whiteBrandIconPromise = fetch("/logo/Blast_Icon_White.png", { cache: "force-cache" })
    .then((res) => (res.ok ? res.blob() : null))
    .then(
      (blob) =>
        new Promise((resolve) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        })
    )
    .catch(() => null);

  return whiteBrandIconPromise;
}

// PDF Export
function exportToPDF(sessions, courseTitle, allModules, whiteIconDataUrl = null) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN = 16;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  let y = MARGIN;

  const newPageIfNeeded = (needed = 20) => {
    if (y + needed > PAGE_H - 20) {
      doc.addPage();
      y = MARGIN;
    }
  };

  // Header
  doc.setFillColor("#111111");
  doc.rect(0, 0, PAGE_W, 32, "F");
  doc.setTextColor("#ffffff");
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  const brandIconSize = 8;
  if (whiteIconDataUrl) {
    doc.addImage(whiteIconDataUrl, "PNG", MARGIN, 6.8, brandIconSize, brandIconSize);
    doc.text("Education", MARGIN + brandIconSize + 3, 13);
  } else {
    doc.text("Education", MARGIN, 13);
  }
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#9aa0a6");
  doc.text("Plataforma de ensino interativo", MARGIN, 20);

  // Generation date (right side)
  const genDate = new Date().toLocaleDateString("pt-BR");
  doc.setFontSize(8);
  doc.text(`Gerado em ${genDate}`, PAGE_W - MARGIN, 20, { align: "right" });

  y = 42;

  // Course title
  doc.setTextColor("#1a1a1a");
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(courseTitle, MARGIN, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#5f6368");
  doc.text("Cronograma de Estudos Sugerido", MARGIN, y);
  y += 14;

  // Summary stats row
  if (sessions.length > 0) {
    const totalWeeks = sessions[sessions.length - 1].weekNum;
    const avgMin = Math.round(sessions.reduce((s, x) => s + x.durationMin, 0) / sessions.length);
    const summary = `${sessions.length} sess\u00f5es  \u00b7  ~${avgMin} min/sess\u00e3o  \u00b7  ${totalWeeks} semanas`;
    doc.setFontSize(9);
    doc.setTextColor("#9aa0a6");
    doc.text(summary, MARGIN, y);
    y += 12;
  }

  // Divider
  doc.setDrawColor("#e0e0e0");
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 8;

  // Sessions grouped by week
  const weeks = {};
  for (const s of sessions) {
    if (!weeks[s.weekNum]) weeks[s.weekNum] = [];
    weeks[s.weekNum].push(s);
  }

  for (const [weekNum, wSessions] of Object.entries(weeks)) {
    newPageIfNeeded(28);

    // Week header bar
    doc.setFillColor("#f8f9fa");
    doc.rect(MARGIN, y, CONTENT_W, 10, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#1a1a1a");
    const wLabel = `SEMANA ${weekNum}`;
    doc.text(wLabel, MARGIN + 4, y + 6.5);

    // Week date range
    const first = wSessions[0].date;
    const last = wSessions[wSessions.length - 1].date;
    const fmtShort = (d) =>
      `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#9aa0a6");
    doc.text(`${fmtShort(first)} - ${fmtShort(last)}`, PAGE_W - MARGIN - 4, y + 6.5, { align: "right" });
    y += 14;

    for (const session of wSessions) {
      newPageIfNeeded(18);
      const color = getModuleColor(session.module.id, allModules);

      // Colored left accent bar
      const [r, g, b] = hexToRgb(color);
      doc.setFillColor(r, g, b);
      doc.rect(MARGIN, y, 3, 12, "F");

      // Day label
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor("#1a1a1a");
      const dateStr = `${session.dayLabel} ${String(session.date.getDate()).padStart(2, "0")}/${String(session.date.getMonth() + 1).padStart(2, "0")}`;
      doc.text(dateStr, MARGIN + 6, y + 4.5);

      // Module + lessons (truncated)
      doc.setFont("helvetica", "normal");
      doc.setTextColor("#5f6368");
      doc.setFontSize(8);
      const lessonTitles = session.lessons.map((l) => fixPtBrText(l.title)).join(", ");
      const truncated = lessonTitles.length > 68 ? `${lessonTitles.slice(0, 65)}...` : lessonTitles;
      doc.text(truncated, MARGIN + 6, y + 9.5);

      // Duration badge (right side)
      doc.setFontSize(8);
      doc.setTextColor("#9aa0a6");
      doc.text(`${session.durationMin} min`, PAGE_W - MARGIN - 4, y + 7, { align: "right" });

      y += 16;
    }

    y += 4;
  }

  // Footer on each page
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p += 1) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setTextColor("#c4c9d0");
    doc.text(`Education  \u00b7  ${courseTitle}`, MARGIN, PAGE_H - 8);
    doc.text(`P\u00e1gina ${p} de ${pageCount}`, PAGE_W - MARGIN, PAGE_H - 8, { align: "right" });
  }

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "cronograma-sql.pdf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Convert hex color to [r, g, b]
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [66, 133, 244];
}

const FOCUS_CLASS = "study-calendar-focus-ring";

function lessonIdOf(lesson) {
  if (typeof lesson === "string") return lesson;
  if (lesson && typeof lesson === "object" && typeof lesson.id === "string") return lesson.id;
  return null;
}

function lessonTitleOf(lesson, fallbackIndex) {
  if (typeof lesson === "string") {
    return lesson.replace(/^lesson_\d+_/, "").replace(/_/g, " ");
  }
  if (lesson && typeof lesson === "object") {
    if (typeof lesson.title === "string" && lesson.title.trim()) return lesson.title;
    if (typeof lesson.id === "string" && lesson.id.trim()) return lesson.id.replace(/_/g, " ");
  }
  return `Aula ${fallbackIndex + 1}`;
}

function truncateLabel(text, maxLen = 52) {
  if (!text || text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}...`;
}

function lessonSlugOf(lesson) {
  if (lesson && typeof lesson === "object" && typeof lesson.slug === "string") return lesson.slug;
  return null;
}

function SessionRow({ session, color, onLessonNavigate, lessonCompletionMap, courseSlug }) {
  const dateStr = session.date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

  const lessonLabels = session.lessons.map((lesson, idx) => ({
    id: lessonIdOf(lesson),
    slug: lessonSlugOf(lesson),
    title: fixPtBrText(lessonTitleOf(lesson, idx)),
    completed: Boolean(lessonIdOf(lesson) && lessonCompletionMap?.[lessonIdOf(lesson)]),
  }));
  const completedLessonCount = lessonLabels.filter((lesson) => lesson.completed).length;
  const sessionStatus =
    lessonLabels.length === 0
      ? "Pendente"
      : completedLessonCount === lessonLabels.length
      ? "Conclu\u00edda"
      : completedLessonCount > 0
        ? "Parcial"
        : "Pendente";
  const statusStyle =
    sessionStatus === "Conclu\u00edda"
      ? { color: "#137333", border: "rgba(19,115,51,0.25)", background: "#e6f4ea" }
      : sessionStatus === "Parcial"
        ? { color: "#b06000", border: "rgba(176,96,0,0.22)", background: "#fff8e1" }
        : { color: uiTokens.colors.textSecondary, border: uiTokens.colors.border, background: uiTokens.colors.canvas };

  return (
    <div
      className="study-calendar-session-row"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.95rem",
        padding: "0.9rem",
        borderRadius: uiTokens.radius.lg,
        background: uiTokens.colors.surface,
        border: `1px solid ${uiTokens.colors.border}`,
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = uiTokens.colors.canvas;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = uiTokens.colors.surface;
      }}
    >
      <div
        style={{
          width: "3px",
          minHeight: "44px",
          borderRadius: "2px",
          background: color,
          flexShrink: 0,
          alignSelf: "stretch",
        }}
      />

      <div style={{ minWidth: "76px" }}>
        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: uiTokens.colors.text, letterSpacing: "0.01em" }}>
          {session.dayLabel}
        </div>
        <div style={{ fontSize: "0.82rem", color: uiTokens.colors.textMuted, marginTop: "2px", fontWeight: 600 }}>
          {dateStr}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: "0.76rem",
            fontWeight: 600,
            color: uiTokens.colors.textSecondary,
            marginBottom: "0.4rem",
            borderRadius: uiTokens.radius.pill,
            background: `${color}22`,
            padding: "0.23rem 0.58rem",
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: uiTokens.radius.pill, background: color }} />
          {fixPtBrText(session.module.title)}
        </div>
        <div
          style={{
            fontSize: "0.9rem",
            color: uiTokens.colors.textSecondary,
            lineHeight: 1.42,
            marginBottom: "0.45rem",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {lessonLabels.map((lesson) => lesson.title).join(" - ")}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.38rem" }}>
          {lessonLabels.map((lesson, idx) => (
            lesson.id ? (
              <Link
                key={lesson.id}
                to={lesson.slug && courseSlug ? `/cursos/${courseSlug}/aulas/${lesson.slug}` : `/lesson/${lesson.id}`}
                onClick={onLessonNavigate}
                className={FOCUS_CLASS}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  borderRadius: uiTokens.radius.pill,
                  border: lesson.completed
                    ? "1px solid rgba(19,115,51,0.25)"
                    : `1px solid ${uiTokens.colors.borderStrong}`,
                  background: lesson.completed ? "#e6f4ea" : uiTokens.colors.surface,
                  color: lesson.completed ? "#137333" : uiTokens.colors.accent,
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  padding: "0.2rem 0.55rem",
                  textDecoration: "none",
                }}
                title={lesson.title}
              >
                {lesson.completed ? `✓ ${truncateLabel(lesson.title, 40)}` : truncateLabel(lesson.title, 44)}
              </Link>
            ) : (
              <span
                key={`${lesson.title}-${idx}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  borderRadius: uiTokens.radius.pill,
                  border: `1px solid ${uiTokens.colors.border}`,
                  background: uiTokens.colors.canvas,
                  color: uiTokens.colors.textSecondary,
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  padding: "0.2rem 0.55rem",
                }}
                title={lesson.title}
              >
                {truncateLabel(lesson.title, 44)}
              </span>
            )
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "0.35rem",
          flexShrink: 0,
          paddingTop: "2px",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "78px",
            fontSize: "0.76rem",
            fontWeight: 700,
            borderRadius: uiTokens.radius.pill,
            border: `1px solid ${statusStyle.border}`,
            background: statusStyle.background,
            color: statusStyle.color,
            padding: "0.22rem 0.56rem",
          }}
        >
          {sessionStatus}
        </span>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "0.9rem",
            color: uiTokens.colors.textSecondary,
            fontWeight: 600,
            borderRadius: uiTokens.radius.pill,
            border: `1px solid ${uiTokens.colors.border}`,
            background: uiTokens.colors.canvas,
            padding: "0.3rem 0.56rem",
          }}
        >
          <Clock size={13} />
          {session.durationMin}m
        </div>
      </div>
    </div>
  );
}

function WeekSection({ weekNum, sessions, allModules, onLessonNavigate, lessonCompletionMap, courseSlug }) {
  const firstDate = sessions[0].date;
  const lastDate = sessions[sessions.length - 1].date;

  const fmtRange = (a, b) => {
    const opts = { day: "numeric", month: "short" };
    return `${a.toLocaleDateString("pt-BR", opts)} - ${b.toLocaleDateString("pt-BR", opts)}`;
  };

  return (
    <div
      className="study-calendar-week-card"
      style={{
        background: uiTokens.colors.surface,
        border: `1px solid ${uiTokens.colors.border}`,
        borderRadius: uiTokens.radius.xl,
        padding: "0.95rem",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "0.8rem",
        }}
      >
        <span
          style={{
            fontSize: "0.78rem",
            fontWeight: 700,
            letterSpacing: "0.11em",
            textTransform: "uppercase",
            color: uiTokens.colors.textMuted,
            whiteSpace: "nowrap",
          }}
        >
          Semana {weekNum}
        </span>
        <div style={{ height: "1px", flex: 1, background: uiTokens.colors.border }} />
        <span style={{ fontSize: "0.86rem", color: uiTokens.colors.textSecondary, fontWeight: 600, whiteSpace: "nowrap" }}>
          {fmtRange(firstDate, lastDate)}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.62rem" }}>
        {sessions.map((s) => (
          <SessionRow
            key={s.sessionIndex}
            session={s}
            color={getModuleColor(s.module.id, allModules)}
            onLessonNavigate={onLessonNavigate}
            lessonCompletionMap={lessonCompletionMap}
            courseSlug={courseSlug}
          />
        ))}
      </div>
    </div>
  );
}

function Pill({ label, active, onClick }) {
  return (
    <button
      type="button"
      className={FOCUS_CLASS}
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: "0.58rem 1.02rem",
        borderRadius: uiTokens.radius.pill,
        border: active
          ? `1px solid ${uiTokens.colors.accent}`
          : `1px solid ${uiTokens.colors.borderStrong}`,
        background: active ? uiTokens.colors.accentSoft : uiTokens.colors.surface,
        color: active ? uiTokens.colors.accent : uiTokens.colors.textSecondary,
        fontSize: "0.92rem",
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function getCoursePath(courseData) {
  const courseId = typeof courseData?.id === "string" ? courseData.id : "";
  if (courseId === "sql-basics") return "/cursos/sql-basico-avancado";
  return "/";
}

export default function StudyCalendarModal({ open, onClose, courseData, lessonCompletionMap = {}, courseSlug = "sql-basico-avancado" }) {
  const modules = courseData?.modules ?? [];
  const courseTitle = fixPtBrText(courseData?.title ?? "SQL do b\u00e1sico ao avan\u00e7ado");

  const defaultStart = toInputDate(nextMonday());
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [pdfBrandIconDataUrl, setPdfBrandIconDataUrl] = useState(null);
  const [calendarHelpOpen, setCalendarHelpOpen] = useState(false);
  const dialogTitleId = useId();

  useEffect(() => {
    let cancelled = false;
    loadWhiteBrandIcon().then((iconDataUrl) => {
      if (!cancelled) {
        setPdfBrandIconDataUrl(iconDataUrl);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    setPdfError("");
    setCalendarHelpOpen(false);

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [open, onClose]);

  const { sessions, totalWeeks, avgSessionMin, warning } = useMemo(() => {
    if (!startDate) return { sessions: [], totalWeeks: 0, avgSessionMin: 0, warning: null };
    return generateSchedule(modules, {
      startDate: new Date(`${startDate}T00:00:00`),
      endDate: endDate ? new Date(`${endDate}T23:59:59`) : null,
      daysPerWeek,
    });
  }, [modules, startDate, endDate, daysPerWeek]);

  const weekGroups = useMemo(() => {
    const map = {};
    for (const s of sessions) {
      if (!map[s.weekNum]) map[s.weekNum] = [];
      map[s.weekNum].push(s);
    }
    return Object.entries(map).map(([wk, ss]) => ({ weekNum: Number(wk), sessions: ss }));
  }, [sessions]);

  const progressSummary = useMemo(() => {
    const lessonIds = [];
    const seen = new Set();
    for (const session of sessions) {
      for (const lesson of session.lessons || []) {
        const lessonId = lessonIdOf(lesson);
        if (!lessonId || seen.has(lessonId)) continue;
        seen.add(lessonId);
        lessonIds.push(lessonId);
      }
    }

    const completedLessons = lessonIds.filter((lessonId) => lessonCompletionMap?.[lessonId]).length;
    const remainingLessons = Math.max(0, lessonIds.length - completedLessons);
    const remainingSessions = sessions.filter((session) => {
      const sessionLessonIds = (session.lessons || []).map((lesson) => lessonIdOf(lesson)).filter(Boolean);
      if (sessionLessonIds.length === 0) return true;
      return !sessionLessonIds.every((lessonId) => lessonCompletionMap?.[lessonId]);
    }).length;
    const remainingMinutes = sessions
      .filter((session) => {
        const sessionLessonIds = (session.lessons || []).map((lesson) => lessonIdOf(lesson)).filter(Boolean);
        if (sessionLessonIds.length === 0) return true;
        return !sessionLessonIds.every((lessonId) => lessonCompletionMap?.[lessonId]);
      })
      .reduce((sum, session) => sum + (session.durationMin || 0), 0);

    return {
      completedLessons,
      remainingLessons,
      remainingSessions,
      remainingMinutes,
    };
  }, [lessonCompletionMap, sessions]);

  const handleExportPDF = () => {
    setPdfLoading(true);
    setPdfError("");
    try {
      exportToPDF(sessions, courseTitle, modules, pdfBrandIconDataUrl);
    } catch (err) {
      console.error("PDF export failed:", err);
      setPdfError("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleOpenCalendarHelp = () => {
    setCalendarHelpOpen(true);
  };

  const handleCloseCalendarHelp = () => {
    setCalendarHelpOpen(false);
  };

  const handleExportICS = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const ics = generateICS(sessions, courseTitle, {
      timezone: "America/Sao_Paulo",
      startHour: 19,
      startMinute: 0,
      baseUrl,
      fallbackClassPath: getCoursePath(courseData),
    });
    downloadICS(ics, "cronograma-sql.ics");
    setCalendarHelpOpen(false);
  };

  const PACE_OPTIONS = [
    { label: "Leve (3x/sem)", value: 3 },
    { label: "Moderado (4x/sem)", value: 4 },
    { label: "Intensivo (5x/sem)", value: 5 },
  ];

  const dateInputStyle = {
    background: uiTokens.colors.surface,
    border: `1px solid ${uiTokens.colors.borderStrong}`,
    borderRadius: uiTokens.radius.sm,
    padding: "0.62rem 0.84rem",
    color: uiTokens.colors.text,
    fontSize: "0.98rem",
    fontWeight: 600,
    fontFamily: "inherit",
    outline: "none",
    cursor: "pointer",
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="calendar-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            background: uiTokens.colors.canvas,
          }}
        >
          <style>{`
            .${FOCUS_CLASS}:focus-visible {
              outline: 2px solid ${uiTokens.colors.accent};
              outline-offset: 2px;
            }
            .study-calendar-week-grid {
              display: grid;
              gap: 1rem;
              grid-template-columns: repeat(1, minmax(0, 1fr));
            }
            @media (min-width: 960px) {
              .study-calendar-week-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
            }
            @media (min-width: 1320px) {
              .study-calendar-week-grid {
                grid-template-columns: repeat(3, minmax(0, 1fr));
              }
            }
            @media (max-width: 640px) {
              .study-calendar-session-row {
                flex-wrap: wrap;
              }
            }
          `}</style>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.85rem",
              padding: "0 1.5rem",
              height: "64px",
              background: uiTokens.colors.surface,
              borderBottom: `1px solid ${uiTokens.colors.border}`,
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              className={FOCUS_CLASS}
              onClick={onClose}
              aria-label="Fechar calendário"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "34px",
                height: "34px",
                border: `1px solid ${uiTokens.colors.borderStrong}`,
                borderRadius: uiTokens.radius.sm,
                background: uiTokens.colors.surface,
                color: uiTokens.colors.textSecondary,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
            <span id={dialogTitleId} style={{ fontSize: "1.02rem", fontWeight: 700, color: uiTokens.colors.text }}>
              Calendário de Estudos
            </span>
            <span style={{ fontSize: "0.92rem", color: uiTokens.colors.textSecondary, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
              - {courseTitle}
            </span>
          </div>

          <div style={{ padding: "1rem 1.5rem 0", flexShrink: 0 }}>
            <div
              style={{
                padding: "1.15rem",
                background: uiTokens.colors.surface,
                border: `1px solid ${uiTokens.colors.border}`,
                borderRadius: uiTokens.radius.xl,
                display: "flex",
                flexWrap: "wrap",
                gap: "1rem 1.15rem",
                alignItems: "flex-end",
              }}
            >
              <label style={{ display: "flex", flexDirection: "column", gap: "0.42rem", minWidth: "220px", flex: "1 1 220px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: uiTokens.colors.textSecondary }}>
                  Início
                </span>
                <input
                  className={FOCUS_CLASS}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={dateInputStyle}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "0.42rem", minWidth: "220px", flex: "1 1 220px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: uiTokens.colors.textSecondary }}>
                  Prazo <span style={{ fontWeight: 500, opacity: 0.8 }}>(opcional)</span>
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <input
                    className={FOCUS_CLASS}
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      ...dateInputStyle,
                      color: endDate ? uiTokens.colors.text : uiTokens.colors.textMuted,
                    }}
                  />
                  {endDate && (
                    <button
                      type="button"
                      className={FOCUS_CLASS}
                      onClick={() => setEndDate("")}
                      title="Remover prazo"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: uiTokens.colors.textMuted,
                        padding: "0.3rem",
                        display: "flex",
                        alignItems: "center",
                        borderRadius: uiTokens.radius.sm,
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </label>

              {!endDate ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.42rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: uiTokens.colors.textSecondary }}>
                    Ritmo
                  </span>
                  <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                    {PACE_OPTIONS.map((opt) => (
                      <Pill
                        key={opt.value}
                        label={opt.label}
                        active={daysPerWeek === opt.value}
                        onClick={() => setDaysPerWeek(opt.value)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.42rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: uiTokens.colors.textSecondary }}>
                    Ritmo
                  </span>
                  <span style={{ fontSize: "0.94rem", color: uiTokens.colors.textSecondary, fontStyle: "italic", paddingTop: "0.35rem", fontWeight: 500 }}>
                    Calculado automaticamente pelo prazo
                  </span>
                </div>
              )}

              {warning && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                    padding: "0.55rem 0.9rem",
                    borderRadius: uiTokens.radius.sm,
                    background: uiTokens.colors.warningBg,
                    border: `1px solid ${uiTokens.colors.warningBorder}`,
                    color: uiTokens.colors.warningText,
                    fontSize: "0.9rem",
                    lineHeight: 1.45,
                    alignSelf: "flex-end",
                  }}
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
                  {warning}
                </div>
              )}
            </div>
          </div>

          {sessions.length > 0 && (
            <div style={{ padding: "0.75rem 1.5rem 0", flexShrink: 0 }}>
              <div
                style={{
                  padding: "0.85rem 0.95rem",
                  background: uiTokens.colors.surface,
                  border: `1px solid ${uiTokens.colors.border}`,
                  borderRadius: uiTokens.radius.xl,
                  display: "grid",
                  gap: "0.7rem",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                }}
              >
                {[
                  { label: "Sess\u00f5es", value: sessions.length },
                  { label: "Semanas", value: totalWeeks },
                  { label: "M\u00e9dia/sess\u00e3o", value: `~${avgSessionMin} min` },
                  { label: "Total estimado", value: `~${Math.round(sessions.reduce((s, x) => s + x.durationMin, 0) / 60)}h` },
                  { label: "Aulas conclu\u00eddas", value: progressSummary.completedLessons },
                  { label: "Aulas restantes", value: progressSummary.remainingLessons },
                  { label: "Sess\u00f5es restantes", value: progressSummary.remainingSessions },
                  { label: "Tempo restante", value: `~${Math.round(progressSummary.remainingMinutes / 60)}h` },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      borderRadius: uiTokens.radius.md,
                      border: `1px solid ${uiTokens.colors.border}`,
                      background: uiTokens.colors.canvas,
                      padding: "0.62rem 0.75rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.15rem",
                    }}
                  >
                    <span style={{ fontSize: "1.24rem", fontWeight: 800, color: uiTokens.colors.text, lineHeight: 1.1 }}>
                      {value}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: uiTokens.colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem 1.25rem" }}>
            {sessions.length === 0 ? (
              <div
                style={{
                  maxWidth: "760px",
                  margin: "0 auto",
                  minHeight: "280px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.8rem",
                  color: uiTokens.colors.textMuted,
                  background: uiTokens.colors.surface,
                  border: `1px solid ${uiTokens.colors.border}`,
                  borderRadius: uiTokens.radius.xl,
                }}
              >
                <BookOpen size={38} strokeWidth={1.2} />
                <p style={{ margin: 0, fontSize: "0.95rem" }}>
                  Selecione uma data de início para gerar o cronograma.
                </p>
              </div>
            ) : (
              <div className="study-calendar-week-grid" style={{ maxWidth: "1380px", margin: "0 auto" }}>
                {weekGroups.map(({ weekNum, sessions: ws }) => (
                  <WeekSection
                    key={weekNum}
                    weekNum={weekNum}
                    sessions={ws}
                    allModules={modules}
                    onLessonNavigate={onClose}
                    lessonCompletionMap={lessonCompletionMap}
                    courseSlug={courseSlug}
                  />
                ))}
              </div>
            )}
          </div>

          {calendarHelpOpen && (
            <div
              onClick={handleCloseCalendarHelp}
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 1200,
                background: "rgba(15, 23, 42, 0.46)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Instruções para adicionar calendário"
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "100%",
                  maxWidth: "760px",
                  borderRadius: uiTokens.radius.xl,
                  background: uiTokens.colors.surface,
                  border: `1px solid ${uiTokens.colors.border}`,
                  boxShadow: "0 28px 70px rgba(15, 23, 42, 0.24)",
                  padding: "1.2rem 1.2rem 1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "1.02rem", fontWeight: 800, color: uiTokens.colors.text }}>
                      Adicionar ao calendário
                    </div>
                    <div style={{ marginTop: "0.25rem", fontSize: "0.9rem", color: uiTokens.colors.textSecondary }}>
                      O arquivo .ics será gerado em GMT-3 (Brasil), com horário padrão às 19:00 e link da aula.
                    </div>
                  </div>
                  <button
                    type="button"
                    className={FOCUS_CLASS}
                    onClick={handleCloseCalendarHelp}
                    aria-label="Fechar instruções"
                    style={{
                      border: `1px solid ${uiTokens.colors.borderStrong}`,
                      borderRadius: uiTokens.radius.sm,
                      background: uiTokens.colors.surface,
                      color: uiTokens.colors.textSecondary,
                      width: 32,
                      height: 32,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>

                <div
                  style={{
                    marginTop: "0.95rem",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "0.8rem",
                  }}
                >
                  <div
                    style={{
                      borderRadius: uiTokens.radius.lg,
                      border: `1px solid ${uiTokens.colors.border}`,
                      background: uiTokens.colors.canvas,
                      padding: "0.78rem 0.85rem",
                    }}
                  >
                    <div style={{ fontSize: "0.85rem", fontWeight: 800, color: uiTokens.colors.text, marginBottom: "0.38rem" }}>
                      Google Calendar
                    </div>
                    <ol style={{ margin: 0, paddingLeft: "1rem", color: uiTokens.colors.textSecondary, fontSize: "0.84rem", lineHeight: 1.52 }}>
                      <li>Clique em "Baixar arquivo .ics".</li>
                      <li>No Google Calendar: Configurações &gt; Importar e exportar.</li>
                      <li>Importe o arquivo para o calendário desejado.</li>
                    </ol>
                  </div>

                  <div
                    style={{
                      borderRadius: uiTokens.radius.lg,
                      border: `1px solid ${uiTokens.colors.border}`,
                      background: uiTokens.colors.canvas,
                      padding: "0.78rem 0.85rem",
                    }}
                  >
                    <div style={{ fontSize: "0.85rem", fontWeight: 800, color: uiTokens.colors.text, marginBottom: "0.38rem" }}>
                      Outlook Calendar
                    </div>
                    <ol style={{ margin: 0, paddingLeft: "1rem", color: uiTokens.colors.textSecondary, fontSize: "0.84rem", lineHeight: 1.52 }}>
                      <li>Clique em "Baixar arquivo .ics".</li>
                      <li>No Outlook Web: Calendário &gt; Adicionar calendário &gt; Carregar de arquivo.</li>
                      <li>No desktop: Arquivo &gt; Abrir/Exportar &gt; Importar iCalendar (.ics).</li>
                    </ol>
                  </div>
                </div>

                <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", gap: "0.6rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className={FOCUS_CLASS}
                    onClick={handleCloseCalendarHelp}
                    style={{
                      border: `1px solid ${uiTokens.colors.borderStrong}`,
                      borderRadius: uiTokens.radius.pill,
                      background: uiTokens.colors.surface,
                      color: uiTokens.colors.textSecondary,
                      padding: "0.58rem 1rem",
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Fechar
                  </button>

                  <button
                    type="button"
                    className={FOCUS_CLASS}
                    onClick={handleExportICS}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      border: "none",
                      borderRadius: uiTokens.radius.pill,
                      background: uiTokens.colors.accent,
                      color: "#fff",
                      padding: "0.62rem 1.12rem",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <Download size={15} />
                    Baixar arquivo .ics
                  </button>
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              position: "sticky",
              bottom: 0,
              padding: "0.9rem 1.5rem",
              background: uiTokens.colors.surface,
              display: "flex",
              gap: "0.75rem",
              justifyContent: "flex-end",
              flexShrink: 0,
              borderTop: `1px solid ${uiTokens.colors.border}`,
              flexWrap: "wrap",
            }}
          >
            {pdfError && (
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  color: "#b06000",
                  fontSize: "0.86rem",
                  fontWeight: 600,
                  marginBottom: "0.2rem",
                }}
              >
                <AlertTriangle size={15} />
                {pdfError}
              </div>
            )}
            <button
              type="button"
              className={FOCUS_CLASS}
              onClick={handleOpenCalendarHelp}
              disabled={sessions.length === 0}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.74rem 1.22rem",
                border: `1px solid ${uiTokens.colors.borderStrong}`,
                borderRadius: uiTokens.radius.pill,
                background: uiTokens.colors.surface,
                color: sessions.length === 0 ? uiTokens.colors.textMuted : uiTokens.colors.text,
                fontSize: "0.94rem",
                fontWeight: 700,
                cursor: sessions.length === 0 ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (sessions.length > 0) e.currentTarget.style.background = uiTokens.colors.canvas;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = uiTokens.colors.surface;
              }}
            >
              <Calendar size={16} />
              Adicionar ao Calendário
            </button>

            <button
              type="button"
              className={FOCUS_CLASS}
              onClick={handleExportPDF}
              disabled={sessions.length === 0 || pdfLoading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.74rem 1.45rem",
                border: "none",
                borderRadius: uiTokens.radius.pill,
                background: sessions.length === 0 ? "#dce3ec" : uiTokens.colors.accent,
                color: sessions.length === 0 ? "#6f7f93" : "#ffffff",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: sessions.length === 0 || pdfLoading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s ease",
                opacity: pdfLoading ? 0.75 : 1,
              }}
              onMouseEnter={(e) => {
                if (sessions.length > 0 && !pdfLoading) e.currentTarget.style.background = uiTokens.colors.accentHover;
              }}
              onMouseLeave={(e) => {
                if (sessions.length > 0) e.currentTarget.style.background = uiTokens.colors.accent;
              }}
            >
              <Download size={16} />
              {pdfLoading ? "Gerando PDF..." : "Exportar PDF"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
