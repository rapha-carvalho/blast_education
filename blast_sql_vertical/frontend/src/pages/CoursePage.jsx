import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const SLUG_TO_COURSE_ID = {
  "sql-basico-avancado": "sql-basics",
};
import { getAccountInfo, getCertificatePdf, getCourseProgress, getCourses, updateProfile } from "../api/client";
import { getFirstLessonSlug } from "../utils/lessonResolver";
import { fixPtBrText } from "../utils/ptBrText";
import { formatDaysUntilUnlock, getDaysSincePurchase, getDaysUntilUnlock } from "../utils/unlockWindow";
import { Play, ChevronDown, FileText, Calendar, FileDown, Lock, CheckCircle, ArrowRight } from "lucide-react";
import BraceParticles from "../components/BraceParticles";
import CertificationCard from "../components/CertificationCard";
import CertificationModal from "../components/CertificationModal";
import FullNameCertificateModal from "../components/FullNameCertificateModal";
import { useAuth } from "../contexts/AuthContext";
import { lessonIsComplete, readAllLessonProgressLocal } from "../utils/progressStore";

const CAPSTONE_FORCE_UNLOCK = true;
const REFUND_LOCKED_MODULE_IDS = new Set(["module-8", "module-9", "module-10", "module-11"]);

/** Unlock certification on the 8th day since purchase (7 full days elapsed). */
const CERTIFICATION_DAYS_AFTER_PURCHASE = 7;
/** Unlock downloadable resources on the 8th day since purchase (7 full days elapsed). */
const RESOURCE_UNLOCK_AFTER_DAYS = 7;

const RESOURCES = [
  {
    icon: FileText,
    title: "Cheatsheet SQL",
    description: "Refer\u00eancia r\u00e1pida com todos os comandos, fun\u00e7\u00f5es e operadores essenciais em um s\u00f3 lugar.",
    badge: "free",
    cta: "Baixar Cheatsheet",
    requiresRefundWindowEnd: true,
  },
  {
    icon: Calendar,
    title: "Calend\u00e1rio Sugerido",
    description: "Plano de estudos de 4 semanas com metas di\u00e1rias para concluir o curso com consist\u00eancia.",
    badge: "free",
    cta: "Ver calend\u00e1rio",
    requiresRefundWindowEnd: false,
  },
  {
    icon: FileDown,
    title: "PDFs das Aulas",
    description: "Material de apoio consolidado de todo o curso, ideal para revisar.",
    badge: "free",
    cta: "Ver Material",
    requiresRefundWindowEnd: true,
  },
];

function ResourceCard({
  icon: Icon,
  title,
  description,
  badge,
  cta,
  onCtaClick,
  previewMedia,
  locked = false,
  lockMessage = "",
  lockedBadgeLabel = "",
  lockedCtaLabel = "",
}) {
  const isPremium = badge === "premium";
  const isTemporarilyLocked = locked && !isPremium;
  const safeTitle = fixPtBrText(title);
  const safeDescription = fixPtBrText(description);
  const safeCta = fixPtBrText(cta);
  const safeLockMessage = fixPtBrText(lockMessage);
  const safeLockedBadgeLabel = fixPtBrText(lockedBadgeLabel);
  const safeLockedCtaLabel = fixPtBrText(lockedCtaLabel);
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
        background: isPremium || isTemporarilyLocked ? "#fff8e1" : "#e8f5e9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: isPremium || isTemporarilyLocked ? "#f59e0b" : "#34A853",
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
        ) : isTemporarilyLocked ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.04em",
            color: "#f59e0b", background: "#fff8e1",
            padding: "3px 10px", borderRadius: "50px",
            border: "1px solid rgba(245,158,11,0.2)",
          }}>
            <Lock size={11} /> {safeLockedBadgeLabel}
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
        {isTemporarilyLocked && (
          <p style={{ margin: "0.9rem 0 0 0", color: "#b06000", fontSize: "0.85rem", lineHeight: 1.5 }}>
            {safeLockMessage}
          </p>
        )}

        <AnimatePresence>
          {previewMedia && isHovered && !isTemporarilyLocked && (
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
        disabled={isPremium || isTemporarilyLocked}
        onClick={!isPremium && !isTemporarilyLocked ? onCtaClick : undefined}
        style={{
          alignSelf: "flex-start",
          padding: "0.5rem 1.25rem",
          borderRadius: "50px",
          border: isPremium || isTemporarilyLocked ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(26,115,232,0.3)",
          background: isPremium || isTemporarilyLocked ? "#f8f9fa" : "#e8f0fe",
          color: isPremium || isTemporarilyLocked ? "#9aa0a6" : "#1a73e8",
          fontSize: "0.9rem",
          fontWeight: 500,
          cursor: isPremium || isTemporarilyLocked ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          transition: "all 0.2s ease",
        }}
      >
        {isTemporarilyLocked ? safeLockedCtaLabel || safeCta : safeCta}
      </button>
    </motion.div>
  );
}

function ModuleAccordion({
  mod,
  index,
  isOpen,
  onToggle,
  lockedLessons,
  completedLessons,
  activeLessonId,
  courseSlug,
  lockedBadgeLabel = "",
  lockedAvailabilityLabel = "",
}) {
  const lessonCount = mod.lessons?.length ?? 0;
  const moduleNum = String(index + 1).padStart(2, "0");
  const moduleLessonIds = (mod.lessons || []).map((lesson) => (typeof lesson === "string" ? lesson : lesson.id));
  const moduleLocked = lessonCount > 0 && moduleLessonIds.every((id) => lockedLessons?.has(id));
  const safeLockedBadgeLabel = fixPtBrText(lockedBadgeLabel);
  const safeLockedAvailabilityLabel = fixPtBrText(lockedAvailabilityLabel);
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
        type="button"
        onClick={moduleLocked ? undefined : onToggle}
        aria-disabled={moduleLocked}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          padding: "1.5rem 0",
          background: "none",
          border: "none",
          cursor: moduleLocked ? "not-allowed" : "pointer",
          textAlign: "left",
          fontFamily: "inherit",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={moduleLocked ? undefined : (e => e.currentTarget.style.opacity = "0.75")}
        onMouseLeave={moduleLocked ? undefined : (e => e.currentTarget.style.opacity = "1")}
      >
        {/* Module number */}
        <span style={{
          fontSize: "1.75rem",
          fontWeight: 700,
          color: moduleLocked ? "rgba(245,158,11,0.45)" : "rgba(0,0,0,0.08)",
          letterSpacing: "-0.04em",
          minWidth: "2.5rem",
          lineHeight: 1,
        }}>
          {moduleNum}
        </span>

        {/* Title + count */}
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "1.1rem", fontWeight: 500, color: moduleLocked ? "#8a5a00" : "#1a1a1a", letterSpacing: "-0.01em", display: "block" }}>
            {fixPtBrText(mod.title)}
          </span>
          <span style={{ fontSize: "0.85rem", color: "#9aa0a6", marginTop: "2px", display: "block" }}>
            {completedInModule} / {lessonCount} {lessonCount === 1 ? "aula concluída" : "aulas concluídas"}
          </span>
          {moduleLocked && (
            <span style={{ fontSize: "0.85rem", color: "#b06000", marginTop: "4px", display: "block" }}>
              {safeLockedAvailabilityLabel}
            </span>
          )}
        </div>

        {/* Chevron */}
        {moduleLocked ? (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.65rem", flexShrink: 0 }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
              color: "#f59e0b",
              background: "#fff8e1",
              padding: "3px 10px",
              borderRadius: "50px",
              border: "1px solid rgba(245,158,11,0.2)",
            }}>
              <Lock size={11} /> {safeLockedBadgeLabel}
            </span>
            <div style={{ color: "#b06000", flexShrink: 0 }}>
              <Lock size={18} />
            </div>
          </div>
        ) : (
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ color: "#9aa0a6", flexShrink: 0 }}
          >
            <ChevronDown size={20} />
          </motion.div>
        )}
      </button>

      {/* Lesson list */}
      <AnimatePresence initial={false}>
        {isOpen && !moduleLocked && (
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

  const getLockedLessons = (course, lessonStatus, advancedModulesUnlocked) => {
    const locked = new Set();
    if (!course) return locked;
    if (!advancedModulesUnlocked) {
      for (const mod of course.modules || []) {
        if (!REFUND_LOCKED_MODULE_IDS.has(mod.id)) continue;
        for (const lesson of mod.lessons || []) {
          locked.add(typeof lesson === "string" ? lesson : lesson.id);
        }
      }
    }
    if (CAPSTONE_FORCE_UNLOCK) return locked;
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
    if (!certificationUnlocked) return;
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
  const courseCompleted = completionPct >= 100 && totalLessons > 0;
  const access = accountInfo?.access;
  const hasActiveAccess = access?.status === "active";
  const purchaseAt = access?.purchase_at;
  const daysSincePurchase = getDaysSincePurchase(purchaseAt);
  const resourceUnlockDaysLabel = formatDaysUntilUnlock(getDaysUntilUnlock(purchaseAt, RESOURCE_UNLOCK_AFTER_DAYS));
  const certificationUnlockDaysLabel = formatDaysUntilUnlock(getDaysUntilUnlock(purchaseAt, CERTIFICATION_DAYS_AFTER_PURCHASE));
  const advancedModulesUnlocked =
    accountInfo == null ||
    (hasActiveAccess && (purchaseAt == null || daysSincePurchase >= RESOURCE_UNLOCK_AFTER_DAYS));
  const lockedLessons = getLockedLessons(course, lessonStatus, advancedModulesUnlocked);
  const downloadableResourcesUnlocked =
    hasActiveAccess &&
    Boolean(purchaseAt) &&
    daysSincePurchase >= RESOURCE_UNLOCK_AFTER_DAYS;
  const showCertificateSection =
    courseCompleted &&
    hasActiveAccess;
  const certificationUnlocked =
    showCertificateSection &&
    (purchaseAt == null || daysSincePurchase >= CERTIFICATION_DAYS_AFTER_PURCHASE);
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
          .course-hero-section {
            padding: 1rem 1rem 0 !important;
          }
          .course-hero-inner {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .course-hero-copy {
            width: 100% !important;
            box-sizing: border-box;
            margin: 0 auto;
            padding: 1.5rem 1.2rem 1.25rem !important;
            border-radius: 24px !important;
            background: linear-gradient(180deg, rgba(248,249,250,0.96), rgba(255,255,255,0.98));
            border: 1px solid rgba(0,0,0,0.06);
            box-shadow: 0 18px 40px rgba(0,0,0,0.05);
          }
          .course-hero-copy .course-hero-kicker {
            margin-bottom: 0.85rem !important;
            font-size: 0.72rem !important;
            letter-spacing: 0.18em !important;
          }
          .course-hero-copy h1 {
            font-size: 1.95rem !important;
            line-height: 1.08 !important;
            margin-bottom: 0.85rem !important;
          }
          .course-hero-copy p {
            font-size: 0.85rem !important;
          }
          .course-hero-copy .course-hero-subline {
            margin-bottom: 1.15rem !important;
            font-size: 0.96rem !important;
            line-height: 1.55 !important;
            color: #5f6368 !important;
          }
          .course-hero-copy .course-hero-stats {
            margin: 0 0 1.25rem 0 !important;
            display: flex !important;
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.5rem;
            letter-spacing: 0 !important;
          }
          .course-hero-copy .course-hero-stat-pill {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.55rem 0.8rem;
            border-radius: 999px;
            background: #ffffff;
            border: 1px solid rgba(0,0,0,0.08);
            box-shadow: 0 8px 18px rgba(0,0,0,0.04);
            font-size: 0.8rem !important;
            font-weight: 600;
            line-height: 1.1;
            white-space: nowrap;
          }
          .course-hero-copy .course-hero-stat-separator {
            display: none !important;
          }
          .course-hero-copy .course-hero-cta {
            width: 100%;
            justify-content: center;
            padding: 0.95rem 1.25rem !important;
          }
          .course-progress-section {
            padding: 1.25rem 1rem 0 !important;
          }
          .course-progress-card {
            box-sizing: border-box;
            border-radius: 24px !important;
            padding: 1.25rem !important;
            gap: 1rem !important;
            box-shadow: 0 16px 36px rgba(0,0,0,0.04) !important;
          }
          .course-progress-top {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0.9rem !important;
          }
          .course-progress-copy h2 {
            font-size: 1.65rem !important;
          }
          .course-progress-copy p {
            font-size: 0.98rem !important;
          }
          .course-progress-summary {
            width: 100%;
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.75rem !important;
          }
          .course-progress-metric-grid {
            display: contents !important;
          }
          .course-progress-metric {
            padding: 0.85rem 0.75rem !important;
            border-radius: 16px !important;
          }
          .course-progress-completion {
            grid-column: 1 / -1;
            display: flex !important;
            align-items: center;
            justify-content: space-between;
            text-align: left !important;
            padding: 0.9rem 1rem;
            border-radius: 18px;
            background: linear-gradient(135deg, rgba(52,168,83,0.14), rgba(255,255,255,0.98));
            border: 1px solid rgba(52,168,83,0.18);
          }
          .course-progress-completion-value {
            font-size: 2rem !important;
          }
          .course-progress-completion > div {
            margin-top: 0 !important;
            font-size: 0.85rem !important;
          }
          .course-progress-bar {
            height: 14px !important;
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
        <div className="course-hero-section" style={{ background: "#ffffff" }}>
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
                <p
                  className="course-hero-kicker"
                  style={{
                  margin: "0 0 1.25rem 0",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#1a73e8",
                  }}
                >
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
                <p
                  className="course-hero-subline"
                  style={{
                  margin: "0 0 2rem 0",
                  fontSize: "clamp(1rem, 2vw, 1.15rem)",
                  color: "#9aa0a6",
                  fontWeight: 300,
                  lineHeight: 1.6,
                  }}
                >
                  {fixPtBrText("Aprenda SQL de forma pr\u00e1tica com datasets reais e exerc\u00edcios interativos.")}
                </p>

                {/* Inline stats */}
                <p
                  className="course-hero-stats"
                  style={{
                  margin: "0 0 2.5rem 0",
                  fontSize: "0.875rem",
                  color: "#5f6368",
                  letterSpacing: "0.02em",
                  }}
                >
                  <span className="course-hero-stat-pill">{fixPtBrText(`${modules.length} m\u00f3dulos`)}</span>
                  <span className="course-hero-stat-separator">{" \u00b7 "}</span>
                  <span className="course-hero-stat-pill">{fixPtBrText(`${totalLessons} aulas`)}</span>
                  <span className="course-hero-stat-separator">{" \u00b7 "}</span>
                  <span className="course-hero-stat-pill">{fixPtBrText(`${completedLessonCount} conclu\u00eddas`)}</span>
                  <span className="course-hero-stat-separator">{" \u00b7 "}</span>
                  <span className="course-hero-stat-pill">{fixPtBrText(`${completionPct}% completo`)}</span>
                </p>

                {/* CTA */}
                <Link
                  className="course-hero-cta"
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
        <div className="course-progress-section" style={{ background: "#ffffff", padding: "3rem 2rem 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <motion.div
              className="course-progress-card"
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
              <div className="course-progress-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div className="course-progress-copy">
                  <h2 style={{ margin: "0 0 0.25rem 0", fontSize: "1.5rem", fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.02em" }}>
                    Seu Progresso
                  </h2>
                  <p style={{ margin: 0, color: "#5f6368", fontSize: "0.95rem" }}>
                    {completedLessonCount} de {totalLessons} aulas concluídas
                  </p>
                </div>
                <div className="course-progress-summary" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                  <div className="course-progress-metric-grid" style={{ display: "flex", gap: "0.75rem" }}>
                    <div className="course-progress-metric" style={{ background: "#e8f0fe", padding: "0.5rem 1rem", borderRadius: "10px", border: "1px solid rgba(26,115,232,0.15)", textAlign: "center" }}>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a73e8", lineHeight: 1 }}>{modules.length}</div>
                      <div style={{ fontSize: "0.65rem", color: "#1a73e8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px", fontWeight: 600 }}>Módulos</div>
                    </div>
                    <div className="course-progress-metric" style={{ background: "#fff8e1", padding: "0.5rem 1rem", borderRadius: "10px", border: "1px solid rgba(245,158,11,0.15)", textAlign: "center" }}>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f59e0b", lineHeight: 1 }}>{remainingLessonCount}</div>
                      <div style={{ fontSize: "0.65rem", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px", fontWeight: 600 }}>Restantes</div>
                    </div>
                  </div>
                  <div className="course-progress-completion" style={{ textAlign: "right" }}>
                    <span className="course-progress-completion-value" style={{ fontSize: "1.75rem", fontWeight: 700, color: completionPct === 100 ? "#34A853" : "#1a1a1a", letterSpacing: "-0.02em", lineHeight: 1 }}>
                      {completionPct}%
                    </span>
                    {completionPct === 100 && <div style={{ fontSize: "0.75rem", color: "#34A853", fontWeight: 600, marginTop: "2px" }}>Concluído!</div>}
                  </div>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="course-progress-bar" style={{ background: "rgba(0,0,0,0.04)", borderRadius: "99px", height: "12px", overflow: "hidden", position: "relative" }}>
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
                const isResourceLocked = Boolean(r.requiresRefundWindowEnd && !downloadableResourcesUnlocked);
                return (
                  <ResourceCard
                    key={normalizedTitle}
                    {...r}
                    cta={r.cta}
                    locked={isResourceLocked}
                    lockedBadgeLabel={`Libera em ${resourceUnlockDaysLabel}`}
                    lockedCtaLabel={`Dispon\u00edvel em ${resourceUnlockDaysLabel}`}
                    lockMessage={
                      isResourceLocked
                        ? `Este material ser\u00e1 liberado em ${resourceUnlockDaysLabel}.`
                        : ""
                    }
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
                  lockedBadgeLabel={`Libera em ${resourceUnlockDaysLabel}`}
                  lockedAvailabilityLabel={`Dispon\u00edvel em ${resourceUnlockDaysLabel}`}
                />
              ))}
            </motion.div>
          </div>
        </div>

        {/* â”€â”€ BOTTOM CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {showCertificateSection && (
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
                {!certificationUnlocked && (
                  <p style={{ margin: "0.75rem 0 0 0", color: "#b06000", fontSize: "0.95rem", lineHeight: 1.5 }}>
                    {`Seu certificado ser\u00e1 liberado em ${certificationUnlockDaysLabel}.`}
                  </p>
                )}
              </motion.div>
              <CertificationCard
                userName={userName}
                onClick={certificationUnlocked ? handleCertificateClick : undefined}
                locked={!certificationUnlocked}
                lockedBadgeLabel={`Libera em ${certificationUnlockDaysLabel}`}
                helperText={
                  !certificationUnlocked
                    ? `O certificado fica dispon\u00edvel em ${certificationUnlockDaysLabel}.`
                    : ""
                }
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
