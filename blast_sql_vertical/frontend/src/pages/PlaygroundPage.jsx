import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft, Check, Database, Play, CheckCircle, Code2,
    BookOpen, Maximize2, X
} from "lucide-react";
import {
    getPlaygroundDatasets,
    getPlaygroundSchema,
    getPlaygroundChallenges,
    validatePlaygroundQuery,
    runSql
} from "../api/client";
import SqlEditor from "../components/SqlEditor";
import ResultTable from "../components/ResultTable";
import PlaygroundSchemaPanel from "../components/PlaygroundSchemaPanel";
import SqlErrorCard from "../components/SqlErrorCard";
import { useIsMobile } from "../hooks/useIsMobile";

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

export default function PlaygroundPage() {
    const { courseSlug } = useParams();
    const sessionId = useSessionId();
    const isMobile = useIsMobile();

    const [datasets, setDatasets] = useState([]);
    const [activeDatasetId, setActiveDatasetId] = useState(null);

    const [schemaTables, setSchemaTables] = useState([]);
    const [challenges, setChallenges] = useState([]);

    const [mode, setMode] = useState("free"); // "free" | "assisted"
    const [activeChallengeIdx, setActiveChallengeIdx] = useState(0);

    const [query, setQuery] = useState("");
    const [result, setResult] = useState({ columns: null, rows: null, error: null });
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);

    // Mobile-only UI state — default "editor" since mode starts as "free"
    const [mobileTab, setMobileTab] = useState("editor"); // "desafio"|"schema"|"editor"
    const [editorFullscreen, setEditorFullscreen] = useState(false);
    const [schemaDrawerOpen, setSchemaDrawerOpen] = useState(false);
    const [resultsOpen, setResultsOpen] = useState(false);

    // Load datasets on mount
    useEffect(() => {
        getPlaygroundDatasets()
            .then(res => {
                setDatasets(res.datasets || []);
                if (res.datasets?.length > 0) {
                    handleSelectDataset(res.datasets[0].id);
                } else {
                    setLoading(false);
                }
            })
            .catch(e => {
                console.error(e);
                setLoading(false);
            });
    }, []);

    const handleSelectDataset = async (datasetId) => {
        setActiveDatasetId(datasetId);
        setLoading(true);
        setResult({ columns: null, rows: null, error: null });
        setFeedback(null);
        setQuery("");
        setResultsOpen(false);

        try {
            const schemaRes = await getPlaygroundSchema(datasetId, sessionId);
            setSchemaTables(schemaRes.tables || []);

            const challRes = await getPlaygroundChallenges(datasetId);
            setChallenges(challRes.challenges || []);
            setActiveChallengeIdx(0);

            if (mode === "assisted" && challRes.challenges?.length > 0) {
                setQuery(challRes.challenges[0].starter_query || "");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const activeDataset = datasets.find(d => d.id === activeDatasetId);
    const activeChallenge = challenges[activeChallengeIdx];

    const handleModeChange = (newMode) => {
        setMode(newMode);
        setFeedback(null);
        setResult({ columns: null, rows: null, error: null });
        setResultsOpen(false);
        if (newMode === "assisted" && activeChallenge) {
            setQuery(activeChallenge.starter_query || "");
            setMobileTab("desafio");
        } else if (newMode === "free") {
            setQuery(`SELECT * FROM ${activeDataset.schema_prefix}.`);
            if (mobileTab === "desafio") setMobileTab("editor");
        }
    };

    const handleChallengeChange = (idx) => {
        setActiveChallengeIdx(idx);
        setFeedback(null);
        setResult({ columns: null, rows: null, error: null });
        setResultsOpen(false);
        setQuery(challenges[idx]?.starter_query || "");
    };

    const handleRun = async () => {
        setFeedback(null);
        setResult({ columns: null, rows: null, error: "Executando..." });
        try {
            const r = await runSql(sessionId, "playground_free", query);
            if (r.success) setResult({ columns: r.columns, rows: r.rows, error: null });
            else setResult({ columns: null, rows: null, error: r.error });
        } catch (e) {
            setResult({ columns: null, rows: null, error: e.message });
        }
        setResultsOpen(true);
    };

    const handleValidate = async () => {
        if (mode !== "assisted" || !activeChallenge) return;
        setFeedback(null);
        setResult({ columns: null, rows: null, error: "Validando..." });
        try {
            const r = await validatePlaygroundQuery(sessionId, activeDatasetId, activeChallenge.id, query);

            const execR = await runSql(sessionId, "playground_exec", query);
            if (execR.success) {
                setResult({ columns: execR.columns, rows: execR.rows, error: null });
            } else {
                setResult({ columns: null, rows: null, error: execR.error });
            }

            if (r.correct) {
                setFeedback({ correct: true, message: "Parabéns, a consulta está correta!" });
            } else {
                setFeedback({ correct: false, message: r.message });
            }
        } catch (e) {
            setResult({ columns: null, rows: null, error: e.message });
            setFeedback({ correct: false, message: e.message });
        }
        setResultsOpen(true);
    };

    // ─── Mobile Layout ────────────────────────────────────────────────────────
    if (isMobile) {
        const tabBtn = (id, icon, label) => {
            const active = mobileTab === id;
            return (
                <button
                    key={id}
                    onClick={() => setMobileTab(id)}
                    style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "5px",
                        height: "100%",
                        border: "none",
                        background: "transparent",
                        borderBottom: active ? "2px solid #1a73e8" : "2px solid transparent",
                        color: active ? "#1a73e8" : "#5f6368",
                        fontWeight: active ? 600 : 500,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        padding: 0,
                        letterSpacing: "0.01em",
                    }}
                >
                    {icon}
                    {label}
                </button>
            );
        };

        const actionBtnBase = {
            flex: 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.4rem",
            padding: "0.7rem 1rem",
            borderRadius: "999px",
            border: "none",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: "pointer",
            fontFamily: "inherit",
            minHeight: 44,
        };

        const hasResults = result.columns || feedback ||
            (result.error && result.error !== "Executando..." && result.error !== "Validando...");
        const isRunning = result.error === "Executando..." || result.error === "Validando...";

        return (
            <div style={{
                height: "100dvh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                background: "#f8f9fa",
            }}>
                {/* ── Header ────────────────────────────────────────────── */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 1rem",
                    height: 56,
                    background: "#fff",
                    borderBottom: "1px solid rgba(0,0,0,0.07)",
                    flexShrink: 0,
                    gap: "0.75rem",
                }}>
                    <Link
                        to={`/cursos/${courseSlug || "sql-basico-avancado"}`}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            padding: "0.4rem 0.75rem",
                            borderRadius: "999px",
                            border: "1px solid rgba(0,0,0,0.1)",
                            background: "#f8f9fa",
                            color: "#1a1a1a",
                            textDecoration: "none",
                            fontSize: "0.8rem",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                        }}
                    >
                        <ArrowLeft size={13} /> Voltar
                    </Link>

                    <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "#1a1a1a", flex: 1, textAlign: "center" }}>
                        Playground SQL
                    </span>

                    {/* Mode toggle */}
                    <div style={{ display: "flex", background: "#f1f3f4", padding: "3px", borderRadius: "999px", flexShrink: 0 }}>
                        <button
                            onClick={() => handleModeChange("free")}
                            style={{
                                padding: "0.3rem 0.65rem",
                                borderRadius: "999px",
                                border: "none",
                                background: mode === "free" ? "#fff" : "transparent",
                                color: mode === "free" ? "#1a1a1a" : "#5f6368",
                                fontWeight: mode === "free" ? 600 : 500,
                                boxShadow: mode === "free" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                fontFamily: "inherit",
                                display: "flex", alignItems: "center", gap: 4,
                            }}
                        >
                            <Code2 size={12} /> Livre
                        </button>
                        <button
                            onClick={() => handleModeChange("assisted")}
                            style={{
                                padding: "0.3rem 0.65rem",
                                borderRadius: "999px",
                                border: "none",
                                background: mode === "assisted" ? "#fff" : "transparent",
                                color: mode === "assisted" ? "#1a1a1a" : "#5f6368",
                                fontWeight: mode === "assisted" ? 600 : 500,
                                boxShadow: mode === "assisted" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                fontFamily: "inherit",
                                display: "flex", alignItems: "center", gap: 4,
                            }}
                        >
                            <CheckCircle size={12} /> Desafios
                        </button>
                    </div>
                </div>

                {/* ── Dataset bar ────────────────────────────────────────── */}
                <div style={{
                    background: "#fff",
                    borderBottom: "1px solid rgba(0,0,0,0.06)",
                    flexShrink: 0,
                    padding: "0.45rem 1rem",
                }}>
                    <div style={{
                        display: "flex",
                        gap: "0.45rem",
                        overflowX: "auto",
                        WebkitOverflowScrolling: "touch",
                    }}>
                        {datasets.map(d => (
                            <button
                                key={d.id}
                                onClick={() => handleSelectDataset(d.id)}
                                style={{
                                    flexShrink: 0,
                                    padding: "0.35rem 0.85rem",
                                    borderRadius: "999px",
                                    border: activeDatasetId === d.id
                                        ? "2px solid #1a73e8"
                                        : "1px solid rgba(0,0,0,0.12)",
                                    background: activeDatasetId === d.id ? "#e8f0fe" : "#f8f9fa",
                                    color: activeDatasetId === d.id ? "#1a73e8" : "#1a1a1a",
                                    fontWeight: activeDatasetId === d.id ? 600 : 500,
                                    fontSize: "0.8rem",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                    fontFamily: "inherit",
                                    minHeight: 32,
                                }}
                            >
                                {d.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Tab bar ────────────────────────────────────────────── */}
                <div style={{
                    display: "flex",
                    background: "#fff",
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                    flexShrink: 0,
                    height: 44,
                }}>
                    {mode === "assisted" && tabBtn("desafio", <BookOpen size={13} />, "Desafio")}
                    {tabBtn("schema", <Database size={13} />, "Schema")}
                    {tabBtn("editor", <Code2 size={13} />, "Editor")}
                </div>

                {/* ── Content area ───────────────────────────────────────── */}
                <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

                    {/* Desafio panel */}
                    <div style={{
                        position: "absolute", inset: 0,
                        visibility: mobileTab === "desafio" ? "visible" : "hidden",
                        pointerEvents: mobileTab === "desafio" ? "auto" : "none",
                        overflowY: "auto",
                        WebkitOverflowScrolling: "touch",
                        padding: "1rem",
                    }}>
                        {mode === "assisted" && challenges.length > 0 ? (
                            <>
                                {/* Challenge pill nav */}
                                <div style={{ display: "flex", gap: "0.45rem", overflowX: "auto", WebkitOverflowScrolling: "touch", marginBottom: "0.85rem" }}>
                                    {challenges.map((c, idx) => (
                                        <button
                                            key={c.id}
                                            onClick={() => handleChallengeChange(idx)}
                                            style={{
                                                flexShrink: 0,
                                                padding: "0.4rem 0.85rem",
                                                borderRadius: "999px",
                                                border: idx === activeChallengeIdx
                                                    ? "2px solid #1a73e8"
                                                    : "1px solid rgba(0,0,0,0.1)",
                                                background: idx === activeChallengeIdx ? "#e8f0fe" : "#fff",
                                                color: idx === activeChallengeIdx ? "#1a73e8" : "#5f6368",
                                                fontWeight: 600,
                                                fontSize: "0.8rem",
                                                cursor: "pointer",
                                                whiteSpace: "nowrap",
                                                fontFamily: "inherit",
                                                minHeight: 34,
                                            }}
                                        >
                                            {c.difficulty}: {c.title}
                                        </button>
                                    ))}
                                </div>
                                {/* Challenge description */}
                                {activeChallenge && (
                                    <div style={{
                                        background: "#fff",
                                        border: "1px solid rgba(0,0,0,0.08)",
                                        borderRadius: 14,
                                        padding: "1rem",
                                        fontSize: "0.925rem",
                                        color: "#3c3c3c",
                                        lineHeight: 1.7,
                                        marginBottom: "1rem",
                                    }}>
                                        {activeChallenge.description}
                                    </div>
                                )}
                                {/* CTA → editor */}
                                <button
                                    onClick={() => setMobileTab("editor")}
                                    style={{
                                        width: "100%",
                                        padding: "0.8rem",
                                        borderRadius: "999px",
                                        border: "none",
                                        background: "#1a73e8",
                                        color: "#fff",
                                        fontWeight: 600,
                                        fontSize: "0.9rem",
                                        cursor: "pointer",
                                        fontFamily: "inherit",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "0.4rem",
                                        minHeight: 44,
                                    }}
                                >
                                    <Code2 size={15} /> Abrir Editor
                                </button>
                            </>
                        ) : mode === "assisted" && challenges.length === 0 && !loading ? (
                            <div style={{ padding: "2rem", textAlign: "center", color: "#5f6368", fontSize: "0.9rem", border: "1px dashed rgba(0,0,0,0.1)", borderRadius: 14 }}>
                                Nenhum desafio encontrado para este dataset.
                            </div>
                        ) : (
                            <div style={{ padding: "2rem 1rem", textAlign: "center", color: "#9aa0a6", fontSize: "0.875rem" }}>
                                Carregando...
                            </div>
                        )}
                    </div>

                    {/* Schema panel */}
                    <div style={{
                        position: "absolute", inset: 0,
                        visibility: mobileTab === "schema" ? "visible" : "hidden",
                        pointerEvents: mobileTab === "schema" ? "auto" : "none",
                        overflowY: "auto",
                        WebkitOverflowScrolling: "touch",
                        padding: "1rem",
                    }}>
                        {loading ? (
                            <div style={{ fontSize: "0.875rem", color: "#9aa0a6", paddingTop: "0.5rem" }}>Carregando...</div>
                        ) : (
                            <PlaygroundSchemaPanel tables={schemaTables} schemaPrefix={activeDataset?.schema_prefix} />
                        )}
                    </div>

                    {/* Editor panel — always mounted, visibility-toggled for Monaco stability */}
                    <div style={{
                        position: "absolute", inset: 0,
                        visibility: mobileTab === "editor" ? "visible" : "hidden",
                        pointerEvents: mobileTab === "editor" ? "auto" : "none",
                        display: "flex",
                        flexDirection: "column",
                    }}>
                        {/* Editor tab header */}
                        <div style={{
                            padding: "0.55rem 1rem",
                            background: "#f8f9fa",
                            borderBottom: "1px solid rgba(0,0,0,0.07)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexShrink: 0,
                        }}>
                            <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1a1a1a" }}>Editor SQL</span>
                            <button
                                onClick={() => setEditorFullscreen(true)}
                                title="Expandir"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 32, height: 32,
                                    borderRadius: 8,
                                    border: "1px solid rgba(0,0,0,0.1)",
                                    background: "#fff",
                                    cursor: "pointer",
                                    padding: 0,
                                }}
                            >
                                <Maximize2 size={14} color="#5f6368" />
                            </button>
                        </div>
                        {/* Monaco fills remaining height */}
                        <div style={{ flex: 1, overflow: "hidden" }}>
                            <SqlEditor value={query} onChange={setQuery} height="100%" />
                        </div>
                    </div>

                </div>

                {/* ── Action bar footer ──────────────────────────────────── */}
                <div style={{
                    display: "flex",
                    gap: "0.65rem",
                    padding: "0.65rem 1rem",
                    paddingBottom: "calc(0.65rem + env(safe-area-inset-bottom, 0px))",
                    background: "#fff",
                    borderTop: "1px solid rgba(0,0,0,0.08)",
                    flexShrink: 0,
                }}>
                    <button
                        onClick={handleRun}
                        disabled={!query.trim()}
                        style={{
                            ...actionBtnBase,
                            background: query.trim() ? "#1a1a1a" : "#e0e0e0",
                            color: query.trim() ? "#fff" : "#9aa0a6",
                            cursor: query.trim() ? "pointer" : "not-allowed",
                        }}
                    >
                        <Play size={14} /> Rodar SQL
                    </button>

                    {mode === "assisted" && activeChallenge && (
                        <button
                            onClick={handleValidate}
                            disabled={!query.trim()}
                            style={{
                                ...actionBtnBase,
                                background: query.trim() ? "#1a73e8" : "#e0e0e0",
                                color: query.trim() ? "#fff" : "#9aa0a6",
                                cursor: query.trim() ? "pointer" : "not-allowed",
                            }}
                        >
                            <Check size={14} /> Validar
                        </button>
                    )}
                </div>

                {/* ── Results bottom sheet ───────────────────────────────── */}
                {(resultsOpen || isRunning) && (
                    <>
                        {/* Backdrop */}
                        <div
                            onClick={() => setResultsOpen(false)}
                            style={{
                                position: "fixed", inset: 0,
                                background: "rgba(0,0,0,0.25)",
                                zIndex: 420,
                            }}
                        />
                        {/* Sheet */}
                        <div style={{
                            position: "fixed",
                            bottom: 0, left: 0, right: 0,
                            zIndex: 430,
                            background: "#fff",
                            borderRadius: "16px 16px 0 0",
                            maxHeight: "65vh",
                            display: "flex",
                            flexDirection: "column",
                            boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
                        }}>
                            {/* Drag handle */}
                            <div style={{ width: 36, height: 4, background: "#e0e0e0", borderRadius: 2, margin: "0.65rem auto 0", flexShrink: 0 }} />
                            {/* Sheet header */}
                            <div style={{
                                padding: "0.65rem 1rem",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                borderBottom: "1px solid rgba(0,0,0,0.07)",
                                flexShrink: 0,
                            }}>
                                <span style={{ fontWeight: 600, fontSize: "0.925rem", color: "#1a1a1a" }}>
                                    {isRunning ? result.error : "Resultado"}
                                </span>
                                <button
                                    onClick={() => setResultsOpen(false)}
                                    style={{ display: "flex", alignItems: "center", padding: 4, background: "transparent", border: "none", cursor: "pointer", color: "#5f6368" }}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            {/* Scrollable content */}
                            <div style={{
                                overflowY: "auto",
                                WebkitOverflowScrolling: "touch",
                                flex: 1,
                                padding: "0.75rem 1rem",
                                paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
                            }}>
                                {isRunning && (
                                    <div style={{ color: "#9aa0a6", fontSize: "0.9rem", paddingTop: "0.5rem" }}>
                                        Aguarde...
                                    </div>
                                )}

                                {!isRunning && feedback && (
                                    <div style={{
                                        padding: "0.85rem 1rem",
                                        borderRadius: 10,
                                        background: feedback.correct ? "#e6f4ea" : "#fce8e6",
                                        color: feedback.correct ? "#137333" : "#c5221f",
                                        fontWeight: 500,
                                        fontSize: "0.9rem",
                                        border: `1px solid ${feedback.correct ? "rgba(19,115,51,0.2)" : "rgba(197,34,31,0.2)"}`,
                                        display: "flex", alignItems: "center", gap: "0.5rem",
                                        marginBottom: "0.75rem",
                                    }}>
                                        {feedback.correct ? <CheckCircle size={17} /> : null}
                                        {feedback.message}
                                    </div>
                                )}

                                {!isRunning && result.error && result.error !== "Executando..." && result.error !== "Validando..." && (
                                    <div style={{ marginBottom: "0.75rem" }}>
                                        <SqlErrorCard rawError={result.error} />
                                    </div>
                                )}

                                {!isRunning && result.columns && (
                                    <div>
                                        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                                            <ResultTable columns={result.columns} rows={result.rows || []} error={null} />
                                        </div>
                                        <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#5f6368" }}>
                                            Total: {result.rows?.length || 0} linha(s) retornada(s).
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ── Schema drawer ──────────────────────────────────────── */}
                {schemaDrawerOpen && (
                    <>
                        <div
                            onClick={() => setSchemaDrawerOpen(false)}
                            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 460 }}
                        />
                        <div style={{
                            position: "fixed",
                            bottom: 0, left: 0, right: 0,
                            zIndex: 470,
                            background: "#fff",
                            borderRadius: "16px 16px 0 0",
                            maxHeight: "78vh",
                            display: "flex",
                            flexDirection: "column",
                        }}>
                            {/* Drag handle */}
                            <div style={{ width: 36, height: 4, background: "#e0e0e0", borderRadius: 2, margin: "0.65rem auto 0", flexShrink: 0 }} />
                            {/* Header */}
                            <div style={{
                                padding: "0.65rem 1rem",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexShrink: 0,
                                borderBottom: "1px solid rgba(0,0,0,0.06)",
                            }}>
                                <span style={{ fontWeight: 600, fontSize: "0.9rem", display: "flex", gap: 6, alignItems: "center", color: "#1a1a1a" }}>
                                    <Database size={14} color="#5f6368" />
                                    Schema: {activeDataset?.schema_prefix || "…"}
                                </span>
                                <button
                                    onClick={() => setSchemaDrawerOpen(false)}
                                    style={{ display: "flex", alignItems: "center", padding: 4, background: "transparent", border: "none", cursor: "pointer", color: "#5f6368" }}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            {/* Content */}
                            <div style={{
                                overflowY: "auto",
                                WebkitOverflowScrolling: "touch",
                                flex: 1,
                                padding: "0.75rem 1rem",
                                paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
                            }}>
                                {loading ? (
                                    <div style={{ fontSize: "0.875rem", color: "#9aa0a6" }}>Carregando...</div>
                                ) : (
                                    <PlaygroundSchemaPanel tables={schemaTables} schemaPrefix={activeDataset?.schema_prefix} />
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ── Fullscreen editor ──────────────────────────────────── */}
                {editorFullscreen && (
                    <div style={{
                        position: "fixed", inset: 0,
                        zIndex: 400,
                        background: "#fff",
                        display: "flex",
                        flexDirection: "column",
                    }}>
                        {/* Fullscreen header */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.45rem",
                            padding: "0 0.75rem",
                            height: 52,
                            flexShrink: 0,
                            background: "#f8f9fa",
                            borderBottom: "1px solid rgba(0,0,0,0.08)",
                        }}>
                            <button
                                onClick={() => setEditorFullscreen(false)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 4,
                                    padding: "0.35rem 0.7rem",
                                    borderRadius: "999px",
                                    border: "1px solid rgba(0,0,0,0.1)",
                                    background: "#fff",
                                    color: "#1a1a1a",
                                    fontWeight: 500,
                                    fontSize: "0.82rem",
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    minHeight: 34,
                                }}
                            >
                                <ArrowLeft size={13} /> Sair
                            </button>
                            <button
                                onClick={() => setSchemaDrawerOpen(true)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 4,
                                    padding: "0.35rem 0.7rem",
                                    borderRadius: "999px",
                                    border: "1px solid rgba(0,0,0,0.1)",
                                    background: "#fff",
                                    color: "#1a1a1a",
                                    fontWeight: 500,
                                    fontSize: "0.82rem",
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    minHeight: 34,
                                }}
                            >
                                <Database size={13} /> Schema
                            </button>

                            <div style={{ flex: 1 }} />

                            <button
                                onClick={handleRun}
                                disabled={!query.trim()}
                                style={{
                                    display: "flex", alignItems: "center", gap: 4,
                                    padding: "0.35rem 0.8rem",
                                    borderRadius: "999px",
                                    border: "none",
                                    background: query.trim() ? "#e8f0fe" : "#f1f3f4",
                                    color: query.trim() ? "#1a73e8" : "#9aa0a6",
                                    fontWeight: 600,
                                    fontSize: "0.82rem",
                                    cursor: query.trim() ? "pointer" : "not-allowed",
                                    fontFamily: "inherit",
                                    minHeight: 34,
                                }}
                            >
                                <Play size={13} /> Rodar
                            </button>

                            {mode === "assisted" && activeChallenge && (
                                <button
                                    onClick={handleValidate}
                                    disabled={!query.trim()}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 4,
                                        padding: "0.35rem 0.8rem",
                                        borderRadius: "999px",
                                        border: "none",
                                        background: query.trim() ? "#1a73e8" : "#f1f3f4",
                                        color: query.trim() ? "#fff" : "#9aa0a6",
                                        fontWeight: 600,
                                        fontSize: "0.82rem",
                                        cursor: query.trim() ? "pointer" : "not-allowed",
                                        fontFamily: "inherit",
                                        minHeight: 34,
                                    }}
                                >
                                    <Check size={13} /> Validar
                                </button>
                            )}
                        </div>

                        {/* Monaco fills remaining height */}
                        <div style={{ flex: 1, overflow: "hidden" }}>
                            <SqlEditor value={query} onChange={setQuery} height="100%" />
                        </div>
                    </div>
                )}

            </div>
        );
    }

    // ─── Desktop Layout (unchanged) ──────────────────────────────────────────
    return (
        <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "0 2rem 3rem" }}>
            <Link
                to={`/cursos/${courseSlug || "sql-basico-avancado"}`}
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

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ marginTop: 0, marginBottom: "0.5rem", color: "#1a1a1a", fontSize: "2rem" }}>Playground SQL</h1>
                    <p style={{ margin: 0, color: "#5f6368", fontSize: "1.05rem" }}>
                        Pratique e explore cenários reais livremente.
                    </p>
                </div>

                {/* Toggle Mode */}
                <div style={{ display: "flex", background: "#f1f3f4", padding: "4px", borderRadius: "999px" }}>
                    <button
                        onClick={() => handleModeChange("free")}
                        style={{
                            padding: "0.5rem 1.2rem",
                            borderRadius: "999px",
                            border: "none",
                            background: mode === "free" ? "#fff" : "transparent",
                            color: mode === "free" ? "#1a1a1a" : "#5f6368",
                            fontWeight: mode === "free" ? 600 : 500,
                            boxShadow: mode === "free" ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            display: "flex", alignItems: "center", gap: "6px"
                        }}
                    >
                        <Code2 size={16} /> Modo Livre
                    </button>
                    <button
                        onClick={() => handleModeChange("assisted")}
                        style={{
                            padding: "0.5rem 1.2rem",
                            borderRadius: "999px",
                            border: "none",
                            background: mode === "assisted" ? "#fff" : "transparent",
                            color: mode === "assisted" ? "#1a1a1a" : "#5f6368",
                            fontWeight: mode === "assisted" ? 600 : 500,
                            boxShadow: mode === "assisted" ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            display: "flex", alignItems: "center", gap: "6px"
                        }}
                    >
                        <CheckCircle size={16} /> Desafios
                    </button>
                </div>
            </div>

            <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "300px 1fr" }}>

                {/* Sidebar */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                    {/* Datasets Selection */}
                    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "16px", padding: "1.2rem" }}>
                        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: "#1a1a1a" }}>Banco de Dados</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {datasets.map(d => (
                                <button
                                    key={d.id}
                                    onClick={() => handleSelectDataset(d.id)}
                                    style={{
                                        padding: "0.8rem",
                                        borderRadius: "10px",
                                        border: activeDatasetId === d.id ? "2px solid #1a73e8" : "1px solid rgba(0,0,0,0.08)",
                                        background: activeDatasetId === d.id ? "#e8f0fe" : "#fff",
                                        textAlign: "left",
                                        cursor: "pointer",
                                        transition: "all 0.15s ease",
                                    }}
                                >
                                    <div style={{ fontWeight: 600, color: activeDatasetId === d.id ? "#1a73e8" : "#1a1a1a", marginBottom: "4px" }}>
                                        {d.name}
                                    </div>
                                    <div style={{ fontSize: "0.8rem", color: "#5f6368", lineHeight: 1.4 }}>
                                        {d.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Schema Panel */}
                    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "16px", padding: "1.2rem", flex: 1 }}>
                        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: "#1a1a1a", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Database size={16} /> Schema: {activeDataset?.schema_prefix}
                        </h3>
                        {loading ? (
                            <div style={{ fontSize: "0.9rem", color: "#9aa0a6" }}>Carregando...</div>
                        ) : (
                            <PlaygroundSchemaPanel tables={schemaTables} schemaPrefix={activeDataset?.schema_prefix} />
                        )}
                    </div>

                </div>

                {/* Main Area */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                    {/* Assisted Challenges Bar */}
                    {mode === "assisted" && challenges.length > 0 && (
                        <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "16px", padding: "1.2rem" }}>
                            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", overflowX: "auto" }}>
                                {challenges.map((c, idx) => (
                                    <button
                                        key={c.id}
                                        onClick={() => handleChallengeChange(idx)}
                                        style={{
                                            padding: "0.5rem 1rem",
                                            borderRadius: "999px",
                                            border: idx === activeChallengeIdx ? "2px solid #1a73e8" : "1px solid rgba(0,0,0,0.1)",
                                            background: idx === activeChallengeIdx ? "#e8f0fe" : "#fff",
                                            color: idx === activeChallengeIdx ? "#1a73e8" : "#5f6368",
                                            fontWeight: 600,
                                            fontSize: "0.9rem",
                                            cursor: "pointer",
                                            whiteSpace: "nowrap"
                                        }}
                                    >
                                        {c.difficulty}: {c.title}
                                    </button>
                                ))}
                            </div>
                            {activeChallenge && (
                                <div style={{ background: "#f8f9fa", padding: "1rem", borderRadius: "10px", fontSize: "1rem", color: "#3c3c3c", lineHeight: 1.6 }}>
                                    {activeChallenge.description}
                                </div>
                            )}
                        </div>
                    )}

                    {mode === "assisted" && challenges.length === 0 && !loading && (
                        <div style={{ padding: "2rem", textAlign: "center", color: "#5f6368", border: "1px dashed rgba(0,0,0,0.1)", borderRadius: "16px" }}>
                            Nenhum desafio encontrado para este dataset.
                        </div>
                    )}

                    {/* SQL Editor Area */}
                    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "16px", overflow: "hidden" }}>
                        <div style={{ padding: "1rem 1.4rem", background: "#f8f9fa", borderBottom: "1px solid rgba(0,0,0,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontWeight: 600, color: "#1a1a1a", fontSize: "0.95rem" }}>
                                Editor SQL
                            </div>
                            <div style={{ display: "flex", gap: "0.75rem" }}>
                                <button
                                    onClick={handleRun}
                                    disabled={!query.trim()}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.3rem",
                                        padding: "0.45rem 1rem",
                                        borderRadius: "999px",
                                        border: "none",
                                        background: "#e8f0fe",
                                        color: "#1a73e8",
                                        fontWeight: 600,
                                        fontSize: "0.85rem",
                                        cursor: query.trim() ? "pointer" : "not-allowed",
                                        opacity: query.trim() ? 1 : 0.5,
                                    }}
                                >
                                    <Play size={14} /> Rodar SQL
                                </button>

                                {mode === "assisted" && activeChallenge && (
                                    <button
                                        onClick={handleValidate}
                                        disabled={!query.trim()}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "0.3rem",
                                            padding: "0.45rem 1rem",
                                            borderRadius: "999px",
                                            border: "none",
                                            background: "#1a73e8",
                                            color: "#fff",
                                            fontWeight: 600,
                                            fontSize: "0.85rem",
                                            cursor: query.trim() ? "pointer" : "not-allowed",
                                            opacity: query.trim() ? 1 : 0.5,
                                        }}
                                    >
                                        <Check size={14} /> Validar Resposta
                                    </button>
                                )}
                            </div>
                        </div>
                        <SqlEditor value={query} onChange={setQuery} height="300px" />
                    </div>

                    {/* Feedback and Results */}
                    {feedback && (
                        <div style={{
                            padding: "1rem",
                            borderRadius: "10px",
                            background: feedback.correct ? "#e6f4ea" : "#fce8e6",
                            color: feedback.correct ? "#137333" : "#c5221f",
                            fontWeight: 500,
                            border: `1px solid ${feedback.correct ? "rgba(19,115,51,0.2)" : "rgba(197,34,31,0.2)"}`,
                            display: "flex", alignItems: "center", gap: "0.5rem"
                        }}>
                            {feedback.correct ? <CheckCircle size={18} /> : null}
                            {feedback.message}
                        </div>
                    )}

                    {result.error && result.error !== "Executando..." && result.error !== "Validando..." && (
                        <SqlErrorCard rawError={result.error} />
                    )}

                    {(result.error === "Executando..." || result.error === "Validando...") && (
                        <div style={{ padding: "1rem" }}>{result.error}</div>
                    )}

                    {result.columns && (
                        <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "16px", padding: "1.2rem", overflowX: "auto" }}>
                            <ResultTable columns={result.columns} rows={result.rows || []} error={null} />
                            <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#5f6368" }}>
                                Total: {result.rows?.length || 0} linha(s) retornada(s).
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
