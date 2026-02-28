import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ReactECharts from "echarts-for-react";
import { getLesson, getLessonProgress, runSql, saveLessonProgress, getCourses } from "../api/client";
import { fixPtBrText } from "../utils/ptBrText";
import BraceParticles from "../components/BraceParticles";
import {
    ArrowLeft,
    CheckCircle2,
    TrendingDown,
    TrendingUp,
    AlertTriangle,
    Zap,
    Printer
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
    mergeProgressEntries,
    normalizeLessonProgress,
    progressUpdatedAt,
    readLessonProgressLocal,
    writeLessonProgressLocal,
} from "../utils/progressStore";
import { resolveLessonKeyToSlug } from "../utils/lessonResolver";

const MASTER_CHALLENGE_ID = "lesson_master_challenge_1";
const DEFAULT_COURSE_SLUG = "sql-basico-avancado";

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

// Formatters
function fmtBRLM(v) {
    const num = Number(v) || 0;
    if (Math.abs(num) >= 1_000_000) return `R$ ${(num / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
    if (Math.abs(num) >= 1_000) return `R$ ${(num / 1_000).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}K`;
    return `R$ ${num.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function fmtPct(v) {
    return `${(Number(v) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function fmtNum(v) {
    return (Number(v) || 0).toLocaleString("pt-BR");
}

function ReportVisualization({ config, data }) {
    if (!config || !data || !Array.isArray(data) || data.length === 0) return null;

    const isMulti = Array.isArray(config);
    const activeConfig = isMulti ? config[0] : config;

    const { type, title, color_scheme, x, y } = activeConfig;
    const isObject = typeof data[0] === 'object' && !Array.isArray(data[0]);

    const getVal = (row, key, fallbackIdx) => {
        if (isObject && key) return row[key];
        return Array.isArray(row) ? row[fallbackIdx] : row;
    };

    if (activeConfig.type === "scorecard") {
        const yKey = Array.isArray(y) ? y[0] : y;
        const val = getVal(data[0], yKey, 0);
        return (
            <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: 12, border: "1px solid rgba(0,0,0,0.06)", display: "inline-flex", flexDirection: "column", gap: 8, marginTop: "1rem" }}>
                <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Resultado Consolidado</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 600, color: "#0f172a" }}>
                    {typeof val === "number" ? (val > 1000 ? fmtNum(val) : val) : val}
                </div>
            </div>
        );
    }

    const isHorizontal = type === "bar_horizontal";
    const isArea = type === "area";
    const isDonut = type === "donut";

    let option = {};

    if (isDonut) {
        const yKey = Array.isArray(y) ? y[0] : y;
        option = {
            title: { text: title, left: "center", textStyle: { fontSize: 13, color: "#475569" } },
            tooltip: { trigger: "item" },
            series: [{
                type: "pie",
                radius: ["40%", "70%"],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 10, borderColor: "#fff", borderWidth: 2 },
                label: { show: false },
                data: data.map(row => ({ value: getVal(row, yKey, 1), name: getVal(row, x, 0) }))
            }]
        };
    } else {
        const yKeys = Array.isArray(y) ? y : [y];
        option = {
            title: { text: title, left: "center", textStyle: { fontSize: 13, color: "#475569" }, top: 0 },
            tooltip: { trigger: "axis" },
            grid: { top: 40, bottom: 40, left: isHorizontal ? 120 : 60, right: 20 },
            xAxis: {
                type: isHorizontal ? "value" : "category",
                data: isHorizontal ? undefined : data.map(row => getVal(row, x, 0)),
                axisLabel: { color: "#64748b", fontSize: 11 }
            },
            yAxis: {
                type: isHorizontal ? "category" : "value",
                data: isHorizontal ? data.map(row => getVal(row, x, 0)) : undefined,
                axisLabel: { color: "#64748b", fontSize: 11 }
            },
            series: yKeys.map((yKey, idx) => ({
                name: yKey,
                data: data.map(row => getVal(row, yKey, idx + 1)),
                type: (type === "line" || isArea) ? "line" : "bar",
                smooth: true,
                areaStyle: isArea ? { opacity: 0.1 } : undefined,
                color: color_scheme === "red" ? "#EF4444" : (color_scheme === "green" ? "#10B981" : "#3B82F6"),
                barWidth: "40%",
            }))
        };
    }

    return (
        <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", marginTop: "1rem" }}>
            <ReactECharts option={option} style={{ height: 260, width: "100%" }} />
        </div>
    );
}

export default function ReportPage() {
    const { lessonId } = useParams();
    const sessionId = useSessionId();
    const { user } = useAuth();

    const [lesson, setLesson] = useState(null);
    const [coursesForReport, setCoursesForReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(null);
    const [metrics, setMetrics] = useState({
        pedidosEntregues: 0,
        receitaLiquida: 0,
        taxaCancelamento: 0,
        convFunil: 0,
    });

    const studentName = user?.user_metadata?.full_name || user?.email || "Aluno";
    const dateLabel = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getLesson(lessonId),
            getLessonProgress(lessonId).catch(() => null),
            getCourses().catch(() => ({ courses: [] })),
        ])
            .then(([l, remote, coursesData]) => {
                if (cancelled) return;
                setLesson(l);
                setCoursesForReport(coursesData || { courses: [] });
                const localProgress = readLessonProgressLocal(user?.id, lessonId);
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
                const normalized = normalizeLessonProgress(merged, (l.exercises || []).length);
                setProgress(normalized);

                if (source === "remote" && remoteProgress && user?.id) {
                    writeLessonProgressLocal(user.id, lessonId, remoteProgress);
                } else if (source === "local" && localProgress) {
                    const localTs = progressUpdatedAt(localProgress);
                    const remoteTs = progressUpdatedAt(remoteProgress);
                    if (localTs > remoteTs) {
                        saveLessonProgress(lessonId, localProgress, Boolean(localProgress.lessonCompleted)).catch(() => { });
                    }
                }

                if (lessonId === MASTER_CHALLENGE_ID) {
                    // Fetch metrics for MC
                    Promise.all([
                        runSql(sessionId, lessonId, "SELECT COUNT(*) FROM capstone.pedidos WHERE status_pedido = 'entregue'"),
                        runSql(sessionId, lessonId, "WITH r AS (SELECT pedido_id, SUM(valor_reembolso) as t FROM capstone.reembolsos GROUP BY pedido_id) SELECT ROUND(SUM(p.valor_bruto - p.desconto_aplicado - COALESCE(r.t,0)),2) FROM capstone.pedidos p LEFT JOIN r ON p.pedido_id = r.pedido_id WHERE p.status_pedido = 'entregue'"),
                        runSql(sessionId, lessonId, "SELECT ROUND(100.0 * SUM(CASE WHEN status_pedido = 'cancelado' THEN 1 ELSE 0 END) / COUNT(*), 2) FROM capstone.pedidos"),
                        runSql(sessionId, lessonId, "WITH f AS (SELECT etapa_funil, COUNT(DISTINCT sessao_id) AS s FROM capstone.eventos_funil GROUP BY etapa_funil), b AS (SELECT MAX(CASE WHEN etapa_funil='visita' THEN s END) as v, MAX(CASE WHEN etapa_funil='compra' THEN s END) as c FROM f) SELECT ROUND(100.0 * c / NULLIF(v,0),2) FROM b")
                    ]).then(responses => {
                        const getScalar = (r) => (r?.success && r.rows?.length && r.rows[0]?.length) ? Number(r.rows[0][0]) : 0;
                        setMetrics({
                            pedidosEntregues: getScalar(responses[0]),
                            receitaLiquida: getScalar(responses[1]),
                            taxaCancelamento: getScalar(responses[2]),
                            convFunil: getScalar(responses[3]),
                        });
                    }).catch(() => { });
                }
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
    }, [lessonId, sessionId, user?.id]);

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#000", color: "#fff" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                    <div className="spinner" style={{ width: 40, height: 40, border: "4px solid rgba(255,255,255,0.1)", borderTop: "4px solid #4285F4", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    <div>Gerando relatório...</div>
                </div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!lesson) {
        return <div style={{ padding: "4rem", textAlign: "center", color: "#fff" }}>Relatório não encontrado.</div>;
    }

    const isMC = lessonId === MASTER_CHALLENGE_ID;
    const contentTabs = (lesson.tabs || []).filter(t => t.type === "content");
    const interpretationTabs = (lesson.tabs || []).filter(t => t.type === "interpretation");
    const challenges = Array.isArray(lesson.exercises) ? lesson.exercises : [];

    const completedCount = progress?.completed?.filter(Boolean).length || 0;
    const interpCount = interpretationTabs.filter(t => (progress?.writtenAnswersByTab?.[t.id] || "").trim().length > 50).length;
    const handlePrintPdf = () => {
        if (typeof window !== "undefined") window.print();
    };

    return (
        <div className="report-page" style={{ minHeight: "100vh", background: "#f8fafc", color: "#1e293b", fontFamily: "'Outfit', 'Inter', sans-serif" }}>
            {/* Header / Nav */}
            <div className="report-top-nav no-print" style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, padding: "1.5rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Link to={(() => { const s = resolveLessonKeyToSlug(coursesForReport, DEFAULT_COURSE_SLUG, lessonId); return s ? `/cursos/${DEFAULT_COURSE_SLUG}/aulas/${s}` : `/lesson/${lessonId}`; })()} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#fff", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, opacity: 0.8, transition: "opacity 0.2s" }} onMouseOver={e => e.currentTarget.style.opacity = 1} onMouseOut={e => e.currentTarget.style.opacity = 0.8}>
                    <ArrowLeft size={16} /> Voltar para a Aula
                </Link>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button
                        onClick={handlePrintPdf}
                        className="report-print-btn"
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

            <button
                type="button"
                onClick={handlePrintPdf}
                className="report-print-fab no-print"
                aria-label="Imprimir ou salvar em PDF"
            >
                <Printer size={16} /> Imprimir / PDF
            </button>

            {/* Hero Cover */}
            <div className="report-hero" style={{ background: "linear-gradient(to bottom, #111 0%, #0a0a0a 100%)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <BraceParticles>
                    <div style={{ padding: "4rem 2rem", pointerEvents: "auto" }}>
                        <div style={{ display: "inline-block", background: "rgba(66, 133, 244, 0.1)", border: "1px solid rgba(66, 133, 244, 0.2)", color: "#4285F4", padding: "0.4rem 1rem", borderRadius: 999, fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "1.5rem" }}>
                            {isMC ? "Relatório Executivo" : "Resumo da Aula"}
                        </div>
                        <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontWeight: 700, color: "#fff", margin: "0 0 1rem 0", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
                            {fixPtBrText(lesson.title)}
                        </h1>
                        <p style={{ fontSize: "1.1rem", color: "#9aa0a6", maxWidth: 600, margin: "0 auto 2rem auto", lineHeight: 1.6 }}>
                            {isMC
                                ? "Documento analítico com foco em receita, cancelamento, funil e qualidade operacional."
                                : "Recapitulação dos principais conceitos e práticas ensinadas nesta aula."}
                        </p>
                        <div style={{ display: "flex", gap: "2rem", justifyContent: "center", color: "#7a8086", fontSize: "0.9rem" }}>
                            <div><strong style={{ color: "#d2d2d2" }}>Aluno(a):</strong> {studentName}</div>
                            <div><strong style={{ color: "#d2d2d2" }}>Data:</strong> {dateLabel}</div>
                        </div>
                    </div>
                </BraceParticles>
            </div>

            {/* Content Section */}
            <div className="report-content" style={{ maxWidth: 1000, margin: "0 auto", padding: "4rem 2rem 6rem" }}>
                <div className="report-print-header">
                    <h1 style={{ margin: 0, fontSize: "1.8rem", color: "#111827" }}>{fixPtBrText(lesson.title)}</h1>
                    <div style={{ marginTop: "0.35rem", color: "#4b5563", fontSize: "0.95rem" }}>
                        Aluno(a): {studentName} | Data: {dateLabel}
                    </div>
                </div>

                {isMC ? (
                    // Master Challenge Layout
                    <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>
                        {/* Business Problem & Context */}
                        <section>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "3rem" }}>
                                <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: "2rem", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)" }}>
                                    <h3 style={{ fontSize: "1.1rem", color: "#0f172a", marginTop: 0, marginBottom: "1rem", fontWeight: 600 }}>Problema de Negócio</h3>
                                    <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.6, color: "#475569" }}>
                                        Crescimento bruscamente desacelerado no H2/2024. Três executivos (CMO, CFO, COO) apresentam hipóteses conflitantes sobre a causa raiz: canais de aquisição, margem de produtos ou qualidade operacional.
                                    </p>
                                </div>
                                <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: "2rem", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)" }}>
                                    <h3 style={{ fontSize: "1.1rem", color: "#0f172a", marginTop: 0, marginBottom: "1rem", fontWeight: 600 }}>Contexto dos Dados</h3>
                                    <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.6, color: "#475569" }}>
                                        Análise baseada em 8.000 pedidos, 24.000 itens e funil de conversão digital da Blast Commerce. O dossiê técnico visa sustentar ou refutar as teorias com evidência SQL pura.
                                    </p>
                                </div>
                            </div>

                            <h2 style={{ fontSize: "1.8rem", color: "#0f172a", margin: "0 0 1.5rem 0", fontWeight: 600 }}>Panorama do Negócio</h2>
                            <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: "2rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)" }}>
                                <p style={{ margin: "0 0 1.5rem 0", fontSize: "1.05rem", lineHeight: 1.7, color: "#64748b" }}>
                                    Progresso: <b style={{ color: "#334155" }}>{completedCount}/{challenges.length}</b> soluções SQL validadas e <b style={{ color: "#334155" }}>{interpCount}/{interpretationTabs.length}</b> insights de negócios documentados.
                                </p>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                                    <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: 12, border: "1px solid rgba(0,0,0,0.05)" }}>
                                        <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem", fontWeight: 500 }}>Pedidos Entregues</div>
                                        <div style={{ fontSize: "1.8rem", fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                                            {fmtNum(metrics.pedidosEntregues)}
                                            <CheckCircle2 color="#34A853" size={20} />
                                        </div>
                                    </div>
                                    <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: 12, border: "1px solid rgba(0,0,0,0.05)" }}>
                                        <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem", fontWeight: 500 }}>Receita Líquida</div>
                                        <div style={{ fontSize: "1.8rem", fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                                            {fmtBRLM(metrics.receitaLiquida)}
                                            <TrendingUp color="#34A853" size={20} />
                                        </div>
                                    </div>
                                    <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: 12, border: "1px solid rgba(0,0,0,0.05)" }}>
                                        <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem", fontWeight: 500 }}>Taxa Cancelamento</div>
                                        <div style={{ fontSize: "1.8rem", fontWeight: 600, color: metrics.taxaCancelamento > 9 ? "#EA4335" : "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                                            {fmtPct(metrics.taxaCancelamento)}
                                            {metrics.taxaCancelamento > 9 ? <AlertTriangle color="#EA4335" size={20} /> : <TrendingDown color="#34A853" size={20} />}
                                        </div>
                                    </div>
                                    <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: 12, border: "1px solid rgba(0,0,0,0.05)" }}>
                                        <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem", fontWeight: 500 }}>Conversão Funil</div>
                                        <div style={{ fontSize: "1.8rem", fontWeight: 600, color: "#4285F4", display: "flex", alignItems: "center", gap: 8 }}>
                                            {fmtPct(metrics.convFunil)}
                                            <Zap color="#4285F4" size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Written Findings */}
                        {interpretationTabs.length > 0 && (
                            <section>
                                <h2 style={{ fontSize: "1.8rem", color: "#0f172a", margin: "0 0 1.5rem 0", fontWeight: 600 }}>Insights Documentados</h2>
                                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                    {interpretationTabs.map((t, idx) => {
                                        const ans = progress?.writtenAnswersByTab?.[t.id]?.trim();
                                        if (!ans) return null;
                                        return (
                                            <div key={t.id} style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: "2rem", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" }}>
                                                <h3 style={{ fontSize: "1.1rem", color: "#0f172a", marginTop: 0, marginBottom: "1rem", display: "flex", alignItems: "center", gap: 10 }}>
                                                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "rgba(66, 133, 244, 0.1)", color: "#4285F4", fontSize: "0.85rem" }}>{idx + 1}</span>
                                                    {fixPtBrText(t.title)}
                                                </h3>
                                                <div className="report-markdown" style={{ color: "#334155", lineHeight: 1.7, fontSize: "0.95rem" }}>
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{ans}</ReactMarkdown>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* SQL Evidences */}
                        <section>
                            <h2 style={{ fontSize: "1.8rem", color: "#0f172a", margin: "0 0 1.5rem 0", fontWeight: 600 }}>Evidências Técnicas</h2>
                            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                {challenges.map((c, i) => {
                                    const sql = progress?.lastQueryByChallenge?.[i];
                                    const completed = progress?.completed?.[i];
                                    if (!completed || !sql) return null;

                                    const snapshot = progress?.resultSnapshotByChallenge?.[i];
                                    return (
                                        <div key={i} style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
                                            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(0,0,0,0.08)", background: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.95rem" }}>Desafio {i + 1}: {fixPtBrText(c.title)}</div>
                                                {snapshot?.rowCount > 0 && <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{snapshot.rowCount} linhas retornadas</div>}
                                            </div>
                                            <div style={{ padding: "1.5rem", background: "#f8fafc" }}>
                                                <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "#0369a1", fontSize: "0.85rem", fontFamily: "JetBrains Mono, monospace" }}>
                                                    {sql}
                                                </pre>
                                            </div>
                                            {/* Data Visualization */}
                                            <div style={{ padding: "0 1.5rem 1.5rem" }}>
                                                {c.chart_config ? (
                                                    <ReportVisualization config={c.chart_config} data={snapshot?.rows || []} />
                                                ) : (
                                                    snapshot?.rows?.length === 1 && snapshot.rows[0]?.length === 1 && (
                                                        <ReportVisualization config={{ type: "scorecard" }} data={snapshot.rows} />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                ) : (
                    // Normal Lesson Layout
                    <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: "3rem", fontSize: "1.05rem", lineHeight: 1.8, color: "#334155", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)" }} className="report-markdown-content">
                        {contentTabs.length > 0 ? (
                            contentTabs.map((t, i) => (
                                <div key={t.id} style={{ marginBottom: i < contentTabs.length - 1 ? "4rem" : 0 }}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {fixPtBrText(t.content_markdown)}
                                    </ReactMarkdown>
                                </div>
                            ))
                        ) : (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {fixPtBrText(lesson.content_markdown)}
                            </ReactMarkdown>
                        )}
                    </div>
                )}

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
        .report-print-header {
          display: none;
        }
        .report-print-fab {
          position: fixed;
          bottom: 1.3rem;
          right: 1.3rem;
          z-index: 40;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: #1f6feb;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.25);
          box-shadow: 0 8px 20px rgba(31,111,235,0.35);
          border-radius: 999px;
          padding: 0.6rem 0.9rem;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }
        .report-print-fab:hover {
          background: #1967d2;
          transform: translateY(-1px);
          box-shadow: 0 12px 22px rgba(25,103,210,0.35);
        }
        @media (max-width: 900px) {
          .report-top-nav {
            flex-wrap: wrap;
            gap: 0.75rem;
          }
          .report-print-fab {
            right: 1rem;
            bottom: 1rem;
          }
        }
        
        @media print {
            @page {
              size: A4;
              margin: 12mm;
            }
            body { background: white !important; }
            .report-top-nav, .report-hero, .no-print { display: none !important; }
            .report-content {
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .report-print-header {
              display: block !important;
              margin-bottom: 12mm;
              padding-bottom: 4mm;
              border-bottom: 1px solid #ddd;
            }
            .report-markdown-content, section > div { 
                box-shadow: none !important; 
                border: 1px solid #ddd !important;
            }
            button { display: none !important; }
            a { text-decoration: none !important; color: inherit !important; }
        }
      `}</style>
        </div>
    );
}
