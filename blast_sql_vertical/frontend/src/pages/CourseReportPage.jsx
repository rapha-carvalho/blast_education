import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getCourses, getLesson } from "../api/client";
import { fixPtBrText } from "../utils/ptBrText";
import BraceParticles from "../components/BraceParticles";
import { ArrowLeft, Printer } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const SLUG_TO_COURSE_ID = {
    "sql-basico-avancado": "sql-basics",
};

/** Strip PLACEHOLDER_IMAGEM text blocks from markdown content. */
function stripPlaceholderImages(text) {
    if (!text || typeof text !== "string") return text ?? "";
    return text.replace(/\s*\[PLACEHOLDER_IMAGEM:[^\]]*\]\s*/g, "").trim();
}

export default function CourseReportPage() {
    const { courseSlug } = useParams();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [lessonsData, setLessonsData] = useState([]);
    const [error, setError] = useState(null);

    const studentName = user?.user_metadata?.full_name || user?.email || "Aluno";
    const dateLabel = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

    useEffect(() => {
        setLoading(true);
        setError(null);

        async function fetchCourseData() {
            try {
                const data = await getCourses();
                const courseId = courseSlug ? SLUG_TO_COURSE_ID[courseSlug] : null;
                const foundCourse = data?.courses?.find(c => c.id === courseId) || data?.courses?.[0];

                if (!foundCourse) {
                    setError("Curso não encontrado.");
                    setLoading(false);
                    return;
                }

                setCourse(foundCourse);

                const lessonIds = [];
                for (const mod of (foundCourse.modules || [])) {
                    for (const l of (mod.lessons || [])) {
                        const lId = typeof l === "string" ? l : l.id;
                        // Exclude master challenge from the consolidated report, since it's an interactive assessment
                        if (lId !== "lesson_master_challenge_1") {
                            lessonIds.push(lId);
                        }
                    }
                }

                // Fetch all lessons in parallel
                const fetchedLessons = await Promise.all(
                    lessonIds.map(id => getLesson(id).catch(() => null))
                );

                setLessonsData(fetchedLessons.filter(Boolean));
            } catch (err) {
                setError("Erro ao carregar os dados do curso.");
            } finally {
                setLoading(false);
            }
        }

        fetchCourseData();
    }, [courseSlug]);


    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f8fafc", color: "#1e293b" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                    <div className="spinner" style={{ width: 40, height: 40, border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #4285F4", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    <div style={{ fontWeight: 500 }}>Gerando material de apoio...</div>
                </div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error || !course) {
        return <div style={{ padding: "4rem", textAlign: "center", color: "#1e293b" }}>{error || "Relatório não encontrado."}</div>;
    }

    return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#1e293b", fontFamily: "'Outfit', 'Inter', sans-serif" }}>
            {/* Header / Nav */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, padding: "1.5rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Link to={courseSlug ? `/cursos/${courseSlug}` : "/"} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#fff", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, opacity: 0.8, transition: "opacity 0.2s" }} onMouseOver={e => e.currentTarget.style.opacity = 1} onMouseOut={e => e.currentTarget.style.opacity = 0.8}>
                    <ArrowLeft size={16} /> Voltar para o Curso
                </Link>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button
                        onClick={() => window.print()}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            background: "rgba(255,255,255,0.15)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            color: "#fff",
                            padding: "0.4rem 0.8rem",
                            borderRadius: 6,
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "background 0.2s"
                        }}
                        onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
                        onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
                    >
                        <Printer size={16} /> Imprimir / PDF
                    </button>
                    <div style={{ fontSize: "0.85rem", letterSpacing: "1px", textTransform: "uppercase", color: "#4285F4", fontWeight: 700 }}>
                        Blast Report
                    </div>
                </div>
            </div>

            {/* Hero Cover */}
            <div style={{ background: "linear-gradient(to bottom, #111 0%, #0a0a0a 100%)", borderBottom: "1px solid rgba(255,255,255,0.05)", pageBreakAfter: "always" }}>
                <BraceParticles braceAnchorSelector="h1">
                    <div style={{ padding: "4rem 2rem", pointerEvents: "auto", minHeight: "60vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ display: "inline-block", background: "rgba(66, 133, 244, 0.1)", border: "1px solid rgba(66, 133, 244, 0.2)", color: "#4285F4", padding: "0.4rem 1rem", borderRadius: 999, fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "1.5rem" }}>
                            Material de Apoio Oficial
                        </div>
                        <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontWeight: 700, color: "#fff", margin: "0 0 1rem 0", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                            {fixPtBrText(course.title)}
                        </h1>
                        <p style={{ fontSize: "1.1rem", color: "#9aa0a6", maxWidth: 600, margin: "0 0 2rem 0", lineHeight: 1.6 }}>
                            Apostila consolidada com todas as referências teóricas, comandos e explicações ensinadas no curso.
                        </p>
                        <div style={{ display: "flex", gap: "2rem", color: "#7a8086", fontSize: "0.9rem", justifyContent: "center", flexWrap: "wrap" }}>
                            <div><strong style={{ color: "#d2d2d2" }}>Aluno(a):</strong> {studentName}</div>
                            <div><strong style={{ color: "#d2d2d2" }}>Data:</strong> {dateLabel}</div>
                        </div>
                    </div>
                </BraceParticles>
            </div>

            {/* Content Section */}
            <div style={{ maxWidth: 1000, margin: "0 auto", padding: "4rem 2rem 6rem" }}>
                {lessonsData.map((lesson, idx) => {
                    const contentTabs = (lesson.tabs || []).filter(t => t.type === "content");
                    const hasContent = contentTabs.length > 0 || lesson.content_markdown;

                    if (!hasContent) return null;

                    return (
                        <div key={idx} style={{ marginBottom: idx < lessonsData.length - 1 ? "6rem" : 0 }} className="lesson-section">
                            <h2 style={{ fontSize: "2rem", color: "#0f172a", margin: "0 0 2rem 0", fontWeight: 700, borderBottom: "2px solid #e2e8f0", paddingBottom: "1rem" }} className="lesson-title">
                                {idx + 1}. {fixPtBrText(lesson.title)}
                            </h2>
                            <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: "3rem", fontSize: "1.05rem", lineHeight: 1.8, color: "#334155", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)" }} className="report-markdown-content">
                                {contentTabs.length > 0 ? (
                                    contentTabs.map((t, i) => (
                                        <div key={t.id} style={{ marginBottom: i < contentTabs.length - 1 ? "4rem" : 0 }}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {stripPlaceholderImages(fixPtBrText(t.content_markdown))}
                                            </ReactMarkdown>
                                        </div>
                                    ))
                                ) : (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {stripPlaceholderImages(fixPtBrText(lesson.content_markdown))}
                                    </ReactMarkdown>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <style>{`
        .report-markdown-content h1, .report-markdown-content h2, .report-markdown-content h3 {
          color: #0f172a;
          margin-top: 2rem;
          margin-bottom: 1rem;
          font-weight: 600;
        }
        .report-markdown-content h2 { font-size: 1.6rem; border-bottom: 1px solid rgba(0,0,0,0.08); padding-bottom: 0.5rem; }
        .report-markdown-content h3 { font-size: 1.3rem; }
        .report-markdown-content p { margin-top: 0; margin-bottom: 1.5rem; }
        .report-markdown-content ul, .report-markdown-content ol { padding-left: 1.5rem; margin-bottom: 1.5rem; }
        .report-markdown-content li { margin-bottom: 0.5rem; }
        .report-markdown-content blockquote {
          margin: 0 0 1.5rem 0;
          padding: 1rem 1.5rem;
          border-left: 4px solid #4285F4;
          background: rgba(66, 133, 244, 0.05);
          color: #334155;
          border-radius: 0 8px 8px 0;
        }
        .report-markdown-content pre {
          background: #f1f5f9;
          padding: 1.2rem;
          border-radius: 8px;
          overflow-x: auto;
          border: 1px solid rgba(0,0,0,0.05);
          margin-bottom: 1.5rem;
        }
        .report-markdown-content code {
          font-family: 'JetBrains Mono', monospace;
          background: rgba(0,0,0,0.05);
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-size: 0.9em;
          color: #be123c;
        }
        .report-markdown-content pre code {
          background: transparent;
          padding: 0;
          color: #0369a1;
        }
        .report-markdown-content img {
          max-width: 100%;
          border-radius: 8px;
          border: 1px solid rgba(0,0,0,0.08);
          margin: 1.5rem 0;
        }
        .report-markdown-content table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1.5rem;
        }
        .report-markdown-content th, .report-markdown-content td {
          border: 1px solid rgba(0,0,0,0.08);
          padding: 0.75rem 1rem;
          text-align: left;
        }
        .report-markdown-content th {
          background: #f8fafc;
          color: #0f172a;
          font-weight: 600;
        }
        
        @media print {
            body { background: white !important; }
            .report-markdown-content, section > div { 
                box-shadow: none !important; 
                border: 1px solid #ddd !important;
            }
            .lesson-section {
                page-break-before: always;
            }
            .lesson-section:first-child {
                page-break-before: avoid;
            }
            .lesson-title {
                margin-top: 0 !important;
                padding-top: 1rem;
            }
            button { display: none !important; }
            a { text-decoration: none !important; color: inherit !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
        </div>
    );
}
