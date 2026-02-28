import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getAccountInfo, getCertificatePdf, getCourseProgress, getCourses, updateProfile } from "../api/client";
import CertificationCard from "../components/CertificationCard";
import FullNameCertificateModal from "../components/FullNameCertificateModal";
import CertificationModal from "../components/CertificationModal";
import { useAuth } from "../contexts/AuthContext";

const SLUG_TO_COURSE_ID = { "sql-basico-avancado": "sql-basics" };
const CERTIFICATION_DAYS_AFTER_PURCHASE = 0;

export default function CertificatePage() {
  const { courseSlug } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [accountInfo, setAccountInfo] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [fullNameModalOpen, setFullNameModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCourses(), getAccountInfo()])
      .then(([data, account]) => {
        if (cancelled) return;
        const courseId = courseSlug ? SLUG_TO_COURSE_ID[courseSlug] : "sql-basics";
        const c = (data?.courses ?? []).find((x) => x.id === courseId) ?? data?.courses?.[0];
        setCourse(c);
        setAccountInfo(account);
        if (c) return getCourseProgress(c.id).then((p) => { if (!cancelled) setProgress(p); });
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [courseSlug]);

  const totalLessons = (course?.modules ?? []).reduce((s, m) => s + (m.lessons?.length ?? 0), 0);
  const completed = progress?.completed_lessons ?? 0;
  const completionPct = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
  const courseCompleted = completionPct >= 100 && totalLessons > 0;
  const hasActiveAccess = accountInfo?.access?.status === "active";
  const daysSincePurchase = accountInfo?.access?.purchase_at
    ? Math.floor((Date.now() / 1000 - accountInfo.access.purchase_at) / 86400)
    : 0;
  const eligible = courseCompleted && hasActiveAccess && daysSincePurchase >= CERTIFICATION_DAYS_AFTER_PURCHASE;

  const userName = accountInfo?.user?.full_name || user?.full_name || user?.email;

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
    await updateProfile({ full_name: fullName });
    const updated = await getAccountInfo();
    setAccountInfo(updated);
    setFullNameModalOpen(false);
    setCertificateModalOpen(true);
    triggerPdfDownload();
  };

  const backTo = courseSlug ? `/cursos/${courseSlug}` : "/cursos/sql-basico-avancado";

  if (loading) {
    return <div style={{ padding: "3rem 2rem", textAlign: "center" }}>Carregando...</div>;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <Link
        to={backTo}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          color: "#1a73e8",
          textDecoration: "none",
          fontWeight: 500,
        }}
      >
        <ArrowLeft size={18} /> Voltar ao curso
      </Link>
      <h1 style={{ margin: "0 0 1rem 0", fontSize: "1.75rem", fontWeight: 600 }}>Certificado</h1>
      {eligible ? (
        <>
          <p style={{ margin: "0 0 1.5rem 0", color: "#5f6368" }}>
            Parabéns! Você concluiu o curso. Clique no certificado para baixar.
          </p>
          <CertificationCard userName={userName} onClick={handleCertificateClick} />
        </>
      ) : (
        <p style={{ margin: 0, color: "#5f6368" }}>
          Conclua todas as aulas e tenha acesso ativo para obter seu certificado.
        </p>
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
    </div>
  );
}
