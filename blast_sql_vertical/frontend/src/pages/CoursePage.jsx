import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const SLUG_TO_COURSE_ID = {
  "sql-basico-avancado": "sql-basics",
};
import { getAccountInfo, getCertificatePdf, getCourseProgress, getCourses, updateProfile } from "../api/client";
import { getFirstLessonSlug } from "../utils/lessonResolver";
import { fixPtBrText } from "../utils/ptBrText";
import { Play, ChevronDown, FileText, Calendar, FileDown, Lock, CheckCircle, ArrowRight } from "lucide-react";
import BraceParticles from "../components/BraceParticles";
import CertificationCard from "../components/CertificationCard";
import CertificationModal from "../components/CertificationModal";
import FullNameCertificateModal from "../components/FullNameCertificateModal";
import { useAuth } from "../contexts/AuthContext";
import { lessonIsComplete, readAllLessonProgressLocal } from "../utils/progressStore";

const CAPSTONE_FORCE_UNLOCK = true;

/** Days after purchase before certification is available. Set to 0 to allow immediately. */
const CERTIFICATION_DAYS_AFTER_PURCHASE = 0;

const RESOURCES = [
  {
    icon: FileText,
    title: "Cheatsheet SQL",
    description: "Refer\u00eancia r\u00e1pida com todos os comandos, fun\u00e7\u00f5es e operadores essenciais em um s\u00f3 lugar.",
    badge: "free",
    cta: "Baixar Cheatsheet",
  },
  {
    icon: Calendar,
    title: "Calend\u00e1rio Sugerido",
    description: "Plano de estudos de 4 semanas com metas di\u00e1rias para concluir o curso com consist\u00eancia.",
    badge: "free",
    cta: "Ver calend\u00e1rio",
  },
  {
    icon: FileDown,
    title: "PDFs das Aulas",
    description: "Material de apoio consolidado de todo o curso, ideal para revisar.",
    badge: "free",
    cta: "Ver Material",
  },
];

function ResourceCard({ icon: Icon, title, description, badge, cta, onCtaClick, previewMedia }) {
  const isPremium = badge === "premium";
  const safeTitle = fixPtBrText(title);
  const safeDescription = fixPtBrText(description);
  const safeCta = fixPtBrText(cta);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        position: "relative",
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: "16px",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
      }}
      whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.08)" }}
    >
      {/* Icon */}
      <div style={{
        width: "48px",
        height: "48px",
        borderRadius: "12px",
        background: isPremium ? "#fff8e1" : "#e8f5e9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: isPremium ? "#f59e0b" : "#34A853",
        flexShrink: 0,
      }}>
        <Icon size={22} />
      </div>

      {/* Badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        {isPremium ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.04em",
            color: "#f59e0b", background: "#fff8e1",
            padding: "3px 10px", borderRadius: "50px",
            border: "1px solid rgba(245,158,11,0.2)",
          }}>
            <Lock size={11} /> Premium
          </span>
        ) : (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.04em",
            color: "#34A853", background: "#e8f5e9",
            padding: "3px 10px", borderRadius: "50px",
            border: "1px solid rgba(52,168,83,0.2)",
          }}>
            <CheckCircle size={11} /> {fixPtBrText("Inclu\u00eddo")}
          </span>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem", fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.02em" }}>
          {safeTitle}
        </h3>
        <p style={{ margin: 0, color: "#5f6368", fontSize: "0.95rem", lineHeight: 1.6 }}>
          {safeDescription}
        </p>

        <AnimatePresence>
          {previewMedia && isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                left: 0,
                right: 0,
                zIndex: 100,
                pointerEvents: "none"
              }}
            >
              <div style={{
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid rgba(0,0,0,0.1)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
                background: "#fff",
                padding: "4px"
              }}>
                <img
                  src={previewMedia}
                  alt={`Preview de ${safeTitle}`}
                  style={{ width: "100%", height: "auto", display: "block", borderRadius: "8px" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        disabled={isPremium}
        onClick={!isPremium ? onCtaClick : undefined}
        style={{
          alignSelf: "flex-start",
          padding: "0.5rem 1.25rem",
          borderRadius: "50px",
          border: isPremium ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(26,115,232,0.3)",
          background: isPremium ? "#f8f9fa" : "#e8f0fe",
          color: isPremium ? "#9aa0a6" : "#1a73e8",
          fontSize: "0.9rem",
          fontWeight: 500,
          cursor: isPremium ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          transition: "all 0.2s ease",
        }}
      >
        {safeCta}
      </button>
    </motion.div>
  );
}

function ModuleAccordion({ mod, index, isOpen, onToggle, lockedLessons, completedLessons, activeLessonId, courseSlug }) {
  const lessonCount = mod.lessons?.length ?? 0;
  const moduleNum = String(index + 1).padStart(2, "0");
  const completedInModule = (mod.lessons || []).filter(l => {
    const id = typeof l === "string" ? l : l.id;
    return completedLessons?.has(id);
  }).length;

  return (
    <div style={{
      borderBottom: "1px solid rgba(0,0,0,0.06)",
    }}>
      {/* Module Header */}
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          padding: "1.5rem 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "inherit",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
      >
        {/* Module number */}
        <span style={{
          fontSize: "1.75rem",
          fontWeight: 700,
          color: "rgba(0,0,0,0.08)",
          letterSpacing: "-0.04em",
          minWidth: "2.5rem",
          lineHeight: 1,
        }}>
          {moduleNum}
        </span>

        {/* Title + count */}
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "1.1rem", fontWeight: 500, color: "#1a1a1a", letterSpacing: "-0.01em", display: "block" }}>
            {fixPtBrText(mod.title)}
          </span>
          <span style={{ fontSize: "0.85rem", color: "#9aa0a6", marginTop: "2px", display: "block" }}>
            {completedInModule} / {lessonCount} {lessonCount === 1 ? "aula concluída" : "aulas concluídas"}
          </span>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          style={{ color: "#9aa0a6", flexShrink: 0 }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>

      {/* Lesson list */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ paddingBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {mod.lessons?.map((L, idx) => {
                const id = typeof L === "string" ? L : L.id;
                const rawTitle = typeof L === "object" && L.title
                  ? L.title
                  : id.replace(/^lesson_\d+_/, "").replace(/_/g, " ");
                const title = fixPtBrText(rawTitle);
                const isLocked = lockedLessons?.has(id);
                const isCompleted = completedLessons?.has(id);
                const isActive = activeLessonId === id;

                if (isLocked) {
                  return (
                    <div
                      key={id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        padding: "0.9rem 1rem 0.9rem 4rem",
                        borderRadius: "10px",
                        color: "#c4c9d0",
                        background: "#fafbfc",
                        border: "1px dashed rgba(0,0,0,0.06)",
                      }}
                    >
                      <span style={{
                        width: "26px", height: "26px",
                        borderRadius: "50%",
                        border: "1px solid rgba(0,0,0,0.08)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.75rem", fontWeight: 500,
                        color: "#c4c9d0",
                        flexShrink: 0,
                      }}>
                        {idx + 1}
                      </span>
                      <span style={{ flex: 1, fontSize: "0.975rem", fontWeight: 400, lineHeight: 1.4 }}>
                        {title}
                      </span>
                      <Lock size={15} color="#c4c9d0" style={{ flexShrink: 0 }} />
                    </div>
                  );
                }

                let itemBg = "transparent";
                let itemBorder = "1px solid transparent";
                let itemColor = "#1a1a1a";
                let hoverBg = "#f8f9fa";
                let iconColor = "#9aa0a6";
                let iconBorder = "1px solid rgba(0,0,0,0.1)";

                if (isCompleted) {
                  itemBg = "#f8f9fa";
                  itemColor = "#9aa0a6";
                  hoverBg = "#f1f3f4";
                  iconColor = "#9aa0a6";
                } else if (isActive) {
                  itemBg = "#e8f0fe";
                  itemBorder = "1px solid rgba(26,115,232,0.3)";
                  itemColor = "#1a73e8";
                  hoverBg = "#d2e3fc";
                  iconColor = "#1a73e8";
                  iconBorder = "1px solid rgba(26,115,232,0.4)";
                }

                const slug = typeof L === "object" && L.slug ? L.slug : null;
                const lessonTo = slug && courseSlug ? `/cursos/${courseSlug}/aulas/${slug}` : `/lesson/${id}`;
                return (
                  <Link
                    key={id}
                    to={lessonTo}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.9rem 1rem 0.9rem 4rem",
                      borderRadius: "10px",
                      color: itemColor,
                      textDecoration: isCompleted ? "line-through" : "none",
                      background: itemBg,
                      transition: "background 0.15s ease",
                      border: itemBorder,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = hoverBg}
                    onMouseLeave={e => e.currentTarget.style.background = itemBg}
                  >
                    <span style={{
                      width: "26px", height: "26px",
                      borderRadius: "50%",
                      border: iconBorder,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.75rem", fontWeight: 500,
                      color: iconColor,
                      flexShrink: 0,
                      textDecoration: "none",
                      background: isCompleted ? "rgba(0,0,0,0.04)" : isActive ? "#ffffff" : "transparent",
                    }}>
                      {isCompleted ? <CheckCircle size={12} /> : idx + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: "0.975rem", fontWeight: isActive ? 600 : 400, lineHeight: 1.4 }}>
                      {title}
                    </span>
                    {isActive ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          color: "#ffffff",
                          background: "#1a73e8",
                          padding: "4px 12px",
                          borderRadius: "50px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          flexShrink: 0,
                          textDecoration: "none",
                        }}
                      >
                        Continuar <ArrowRight size={12} />
                      </span>
                    ) : isCompleted ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          color: "#9aa0a6",
                          fontSize: "0.78rem",
                          fontWeight: 500,
                          flexShrink: 0,
                          textDecoration: "none",
                        }}
                      >
                        Concluída
                      </span>
                    ) : (
                      <Play size={15} color="#5f6368" style={{ flexShrink: 0 }} />
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getCourseLessonIds(course) {
  const lessonIds = [];
  for (const mod of course?.modules || []) {
    for (const lesson of mod.lessons || []) {
      lessonIds.push(typeof lesson === "string" ? lesson : lesson.id);
    }
  }
  return lessonIds;
}

function buildLocalCourseProgress(course, userId) {
  const lessonIds = getCourseLessonIds(course);
  const localLessons = readAllLessonProgressLocal(userId);
  const lessonStatus = {};
  for (const lessonId of lessonIds) {
    lessonStatus[lessonId] = lessonIsComplete(localLessons?.[lessonId]);
  }
  const completedLessons = Object.values(lessonStatus).filter(Boolean).length;
  const totalLessons = lessonIds.length;
  const remainingLessons = Math.max(0, totalLessons - completedLessons);
  const completionPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  return {
    course_id: course?.id || "",
    total_lessons: totalLessons,
    completed_lessons: completedLessons,
    remaining_lessons: remainingLessons,
    completion_pct: completionPct,
    lesson_status: lessonStatus,
  };
}

export default function CoursePage() {
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openModules, setOpenModules] = useState(new Set(["module-1"]));
  const [courseProgress, setCourseProgress] = useState(null);
  const [accountInfo, setAccountInfo] = useState(null);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [fullNameModalOpen, setFullNameModalOpen] = useState(false);
  const [certToast, setCertToast] = useState("");

  const getLockedLessons = (course, lessonStatus) => {
    const locked = new Set();
    if (CAPSTONE_FORCE_UNLOCK) return locked;
    if (!course) return locked;
    const allLessonIds = getCourseLessonIds(course);
    const capstoneId = "lesson_master_challenge_1";
    if (!allLessonIds.includes(capstoneId)) return locked;

    const pending = allLessonIds
      .filter((id) => id !== capstoneId)
      .filter((id) => !lessonStatus?.[id]);
    if (pending.length > 0) locked.add(capstoneId);
    return locked;
  };

  useEffect(() => {
    getCourses()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const allCourses = data?.courses ?? [];
    if (allCourses.length === 0) return undefined;

    const resolvedCourseId = courseSlug ? SLUG_TO_COURSE_ID[courseSlug] : null;
    const selectedCourse = resolvedCourseId
      ? allCourses.find((c) => c.id === resolvedCourseId)
      : allCourses[0];
    if (!selectedCourse) return undefined;

    const fallback = buildLocalCourseProgress(selectedCourse, user?.id);
    setCourseProgress(fallback);

    let cancelled = false;
    getCourseProgress(selectedCourse.id)
      .then((remote) => {
        if (!cancelled && remote) {
          setCourseProgress(remote);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCourseProgress(fallback);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [courseSlug, data, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setAccountInfo(null);
      return;
    }
    getAccountInfo()
      .then(setAccountInfo)
      .catch(() => setAccountInfo(null));
  }, [user?.id]);

  const toggleModule = (id) => {
    setOpenModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const triggerPdfDownload = () => {
    getCertificatePdf()
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Certificado_SQL_Blast.pdf";
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch((err) => {
        if (err?.code === "FULL_NAME_REQUIRED") {
          setCertificateModalOpen(false);
          setFullNameModalOpen(true);
        }
      });
  };

  const handleCertificateClick = () => {
    const hasFullName = Boolean(accountInfo?.user?.full_name?.trim());
    if (!hasFullName) {
      setFullNameModalOpen(true);
      return;
    }
    setCertificateModalOpen(true);
    triggerPdfDownload();
  };

  const handleFullNameSubmit = async (fullName) => {
    const updated = await updateProfile({ full_name: fullName });
    setAccountInfo(updated);
    setCertToast("Nome salvo com sucesso");
    setTimeout(() => setCertToast(""), 3000);
    setFullNameModalOpen(false);
    setCertificateModalOpen(true);
    triggerPdfDownload();
  };

  if (loading) return (
    <div style={{ padding: "8rem 2rem", textAlign: "center", color: "#9aa0a6", fontWeight: 300, fontSize: "1rem" }}>
      Carregando...
    </div>
  );
  if (error) return (
    <div style={{ padding: "8rem 2rem", textAlign: "center", color: "#EA4335" }}>
      Erro: {error}
    </div>
  );

  const courseId = courseSlug ? SLUG_TO_COURSE_ID[courseSlug] : null;
  const allCourses = data?.courses ?? [];
  const course = courseId
    ? allCourses.find((c) => c.id === courseId)
    : allCourses[0];

  if (courseSlug && !course) {
    return (
      <div style={{ padding: "8rem 2rem", textAlign: "center", color: "#9aa0a6" }}>
        {fixPtBrText("Curso n\u00e3o encontrado.")}
      </div>
    );
  }

  const modules = course?.modules ?? [];
  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);
  const effectiveProgress = course ? (courseProgress || buildLocalCourseProgress(course, user?.id)) : null;
  const lessonStatus = effectiveProgress?.lesson_status ?? {};
  const completedLessonCount = effectiveProgress?.completed_lessons ?? 0;
  const remainingLessonCount = effectiveProgress?.remaining_lessons ?? Math.max(0, totalLessons - completedLessonCount);
  const completionPct = effectiveProgress?.completion_pct ?? (totalLessons > 0 ? Math.round((completedLessonCount / totalLessons) * 100) : 0);
  const completedLessonSet = new Set(
    Object.entries(lessonStatus)
      .filter(([, done]) => Boolean(done))
      .map(([lessonId]) => lessonId)
  );
  const lockedLessons = getLockedLessons(course, lessonStatus);

  const courseCompleted = completionPct >= 100 && totalLessons > 0;
  const access = accountInfo?.access;
  const hasActiveAccess = access?.status === "active";
  const purchaseAt = access?.purchase_at;
  const daysSincePurchase = purchaseAt
    ? Math.floor((Date.now() / 1000 - purchaseAt) / 86400)
    : 0;
  const eligibleForCertification =
    courseCompleted &&
    hasActiveAccess &&
    daysSincePurchase >= CERTIFICATION_DAYS_AFTER_PURCHASE;
  const userName = accountInfo?.user?.full_name || user?.full_name || user?.email;

  const firstLessonSlug = getFirstLessonSlug(data, courseSlug || "sql-basico-avancado");

  const activeLessonId = (() => {
    for (const mod of modules) {
      for (const l of mod.lessons || []) {
        const id = typeof l === "string" ? l : l.id;
        if (!completedLessonSet.has(id) && !lockedLessons.has(id)) {
          return id;
        }
      }
    }
    return null;
  })();

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .course-hero-inner {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .course-hero-copy {
            width: min(600px, 82%) !important;
            margin: 0 auto;
          }
          .course-hero-copy h1 {
            font-size: 1.55rem !important;
            line-height: 1.2 !important;
          }
          .course-hero-copy p {
            font-size: 0.85rem !important;
          }
          .course-cta-section {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .course-cta-copy {
            width: min(600px, 82%) !important;
            margin: 0 auto;
          }
          .course-cta-copy h2 {
            font-size: 1.4rem !important;
          }
        }
      `}</style>
      <div style={{ background: "#ffffff" }}>

        {/* â”€â”€ HERO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{ background: "#ffffff" }}>
          <div className="course-hero-inner" style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 2rem" }}>
            <BraceParticles>
              <motion.div
                className="course-hero-copy"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                style={{ textAlign: "center" }}
              >
                {/* Eyebrow */}
                <p style={{
                  margin: "0 0 1.25rem 0",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#1a73e8",
                }}>
                  {fixPtBrText("SQL do b\u00e1sico ao Avan\u00e7ado")}
                </p>

                {/* Main Heading */}
                <h1 style={{
                  margin: "0 0 1rem 0",
                  fontSize: "clamp(2rem, 6vw, 4rem)",
                  fontWeight: 500,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.05,
                  color: "#1a1a1a",
                }}>
                  {fixPtBrText("De zero queries a an\u00e1lises")}<br />
                  <span style={{ color: "#5f6368" }}>{fixPtBrText("complexas de neg\u00f3cio")}</span>
                </h1>

                {/* Sub-line */}
                <p style={{
                  margin: "0 0 2rem 0",
                  fontSize: "clamp(1rem, 2vw, 1.15rem)",
                  color: "#9aa0a6",
                  fontWeight: 300,
                  lineHeight: 1.6,
                }}>
                  {fixPtBrText("Aprenda SQL de forma pr\u00e1tica com datasets reais e exerc\u00edcios interativos.")}
                </p>

                {/* Inline stats */}
                <p style={{
                  margin: "0 0 2.5rem 0",
                  fontSize: "0.875rem",
                  color: "#5f6368",
                  letterSpacing: "0.02em",
                }}>
                  {fixPtBrText(`${modules.length} m\u00f3dulos \u00b7 ${totalLessons} aulas \u00b7 ${completedLessonCount} conclu\u00eddas \u00b7 ${completionPct}% completo`)}
                </p>

                {/* CTA */}
                <Link
                  to={firstLessonSlug ? `/cursos/${courseSlug || "sql-basico-avancado"}/aulas/${firstLessonSlug}` : "/cursos/sql-basico-avancado"}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.875rem 2rem",
                    background: "#1a1a1a",
                    color: "#ffffff",
                    borderRadius: "50px",
                    textDecoration: "none",
                    fontWeight: 500,
                    fontSize: "0.975rem",
                    letterSpacing: "-0.01em",
                    transition: "background 0.2s ease, transform 0.2s ease",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "#000000";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "#1a1a1a";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {fixPtBrText("Come\u00e7ar primeira aula")} <ArrowRight size={16} />
                </Link>
              </motion.div>
            </BraceParticles>
          </div>
        </div>

        {/* â”€â”€ STATS BAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{ background: "#ffffff", padding: "3rem 2rem 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{
                background: "#f8f9fa",
                border: "1px solid rgba(0,0,0,0.06)",
                borderRadius: "20px",
                padding: "1.5rem 2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                boxShadow: "0 4px 24px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h2 style={{ margin: "0 0 0.25rem 0", fontSize: "1.5rem", fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.02em" }}>
                    Seu Progresso
                  </h2>
                  <p style={{ margin: 0, color: "#5f6368", fontSize: "0.95rem" }}>
                    {completedLessonCount} de {totalLessons} aulas concluídas
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <div style={{ background: "#e8f0fe", padding: "0.5rem 1rem", borderRadius: "10px", border: "1px solid rgba(26,115,232,0.15)", textAlign: "center" }}>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a73e8", lineHeight: 1 }}>{modules.length}</div>
                      <div style={{ fontSize: "0.65rem", color: "#1a73e8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px", fontWeight: 600 }}>Módulos</div>
                    </div>
                    <div style={{ background: "#fff8e1", padding: "0.5rem 1rem", borderRadius: "10px", border: "1px solid rgba(245,158,11,0.15)", textAlign: "center" }}>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f59e0b", lineHeight: 1 }}>{remainingLessonCount}</div>
                      <div style={{ fontSize: "0.65rem", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px", fontWeight: 600 }}>Restantes</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "1.75rem", fontWeight: 700, color: completionPct === 100 ? "#34A853" : "#1a1a1a", letterSpacing: "-0.02em", lineHeight: 1 }}>
                      {completionPct}%
                    </span>
                    {completionPct === 100 && <div style={{ fontSize: "0.75rem", color: "#34A853", fontWeight: 600, marginTop: "2px" }}>Concluído!</div>}
                  </div>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div style={{ background: "rgba(0,0,0,0.04)", borderRadius: "99px", height: "12px", overflow: "hidden", position: "relative" }}>
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${completionPct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    background: completionPct === 100 ? "#34A853" : "linear-gradient(90deg, #1a73e8, #4285f4)",
                    borderRadius: "99px",
                  }}
                />
              </div>

            </motion.div>
          </div>
        </div>

        {/* â”€â”€ RESOURCES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{ background: "#f8f9fa", padding: "6rem 2rem" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{ marginBottom: "3rem" }}
            >
              <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#1a1a1a" }}>
                Recursos do Curso
              </h2>
              <p style={{ margin: 0, color: "#9aa0a6", fontSize: "1rem", fontWeight: 300 }}>
                Materiais de apoio para acelerar seu aprendizado.
              </p>
            </motion.div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}>
              {RESOURCES.map((r) => {
                const normalizedTitle = fixPtBrText(r.title);
                return (
                  <ResourceCard
                    key={normalizedTitle}
                    {...r}
                    cta={r.cta}
                    onCtaClick={
                      normalizedTitle === "Calendário Sugerido" ? () => navigate(`/cursos/${courseSlug || "sql-basico-avancado"}/calendario`) :
                        normalizedTitle === "Cheatsheet SQL" ? () => navigate(`/cursos/${courseSlug || "sql-basico-avancado"}/cheatsheet`) :
                          normalizedTitle === "PDFs das Aulas" ? () => navigate(`/cursos/${courseSlug || "sql-basico-avancado"}/resumo`) :
                            undefined
                    }
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* â”€â”€ CURRICULUM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{ background: "#ffffff", padding: "6rem 2rem" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{ marginBottom: "3rem", display: "flex", alignItems: "baseline", gap: "1rem", flexWrap: "wrap" }}
            >
              <h2 style={{ margin: 0, fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#1a1a1a" }}>
                {fixPtBrText("Curr\u00edculo Completo")}
              </h2>
              <span style={{
                padding: "3px 12px",
                borderRadius: "50px",
                background: "#e8f0fe",
                color: "#1a73e8",
                fontSize: "0.85rem",
                fontWeight: 500,
              }}>
                {totalLessons} aulas
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {modules.map((mod, idx) => (
                <ModuleAccordion
                  key={mod.id}
                  mod={mod}
                  index={idx}
                  isOpen={openModules.has(mod.id)}
                  onToggle={() => toggleModule(mod.id)}
                  lockedLessons={lockedLessons}
                  completedLessons={completedLessonSet}
                  activeLessonId={activeLessonId}
                  courseSlug={courseSlug || "sql-basico-avancado"}
                />
              ))}
            </motion.div>
          </div>
        </div>

        {/* â”€â”€ BOTTOM CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {eligibleForCertification && (
          <div style={{ background: "#f8f9fa", padding: "6rem 2rem" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                style={{ marginBottom: "2rem" }}
              >
                <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#1a1a1a" }}>
                  Certificado
                </h2>
                <p style={{ margin: 0, color: "#9aa0a6", fontSize: "1rem", fontWeight: 300 }}>
                  Parabéns! Você concluiu o curso. Clique no certificado para abrir.
                </p>
              </motion.div>
              <CertificationCard
                userName={userName}
                onClick={handleCertificateClick}
              />
            </div>
          </div>
        )}

        <div className="course-cta-section" style={{ background: "#111111", padding: "6rem 2rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <BraceParticles>
              <motion.div
                className="course-cta-copy"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                style={{ textAlign: "center" }}
              >
                <h2 style={{ margin: "0 0 1rem 0", fontSize: "clamp(1.5rem, 4vw, 2.5rem)", fontWeight: 500, letterSpacing: "-0.04em", color: "#ffffff" }}>
                  Pratique SQL de forma livre
                </h2>
                <p style={{ margin: "0 0 2.5rem 0", color: "rgba(255,255,255,0.55)", fontSize: "1rem", fontWeight: 300 }}>
                  Treine suas habilidades no Playground.
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <Link
                    to={`/cursos/${courseSlug || "sql-basico-avancado"}/playground`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.875rem 2rem",
                      background: "#1a73e8",
                      color: "#ffffff",
                      borderRadius: "50px",
                      textDecoration: "none",
                      fontWeight: 500,
                      fontSize: "0.975rem",
                      transition: "background 0.2s ease, transform 0.2s ease",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "#1557b0";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "#1a73e8";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    Acessar Playground
                  </Link>
                </div>
              </motion.div>
            </BraceParticles>
          </div>
        </div>

      </div>

      {/* â”€â”€ STUDY CALENDAR MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {certToast && (
        <div
          style={{
            position: "fixed",
            bottom: "1.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 101,
            marginTop: "0.8rem",
            border: "1px solid rgba(19,115,51,0.25)",
            background: "rgba(19,115,51,0.08)",
            color: "#137333",
            borderRadius: "12px",
            padding: "0.7rem 0.9rem",
          }}
        >
          {certToast}
        </div>
      )}
      <FullNameCertificateModal
        open={fullNameModalOpen}
        onClose={() => setFullNameModalOpen(false)}
        onSubmit={handleFullNameSubmit}
      />
      <CertificationModal
        open={certificateModalOpen}
        onClose={() => setCertificateModalOpen(false)}
        userName={userName}
        onDownloadPdf={triggerPdfDownload}
      />
    </>
  );
}
