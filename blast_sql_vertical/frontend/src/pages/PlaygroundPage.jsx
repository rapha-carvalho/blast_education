import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft, Check, Lock, Database, Play, CheckCircle, Code2
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
        if (newMode === "assisted" && activeChallenge) {
            setQuery(activeChallenge.starter_query || "");
        } else if (newMode === "free") {
            setQuery(`SELECT * FROM ${activeDataset.schema_prefix}.`);
        }
    };

    const handleChallengeChange = (idx) => {
        setActiveChallengeIdx(idx);
        setFeedback(null);
        setResult({ columns: null, rows: null, error: null });
        setQuery(challenges[idx]?.starter_query || "");
    };

    const handleRun = async () => {
        setFeedback(null);
        setResult({ columns: null, rows: null, error: "Executando..." });
        try {
            // Free mode actually uses the same engine, but does NOT validate correctness
            const r = await runSql(sessionId, "playground_free", query);
            if (r.success) setResult({ columns: r.columns, rows: r.rows, error: null });
            else setResult({ columns: null, rows: null, error: r.error });
        } catch (e) {
            setResult({ columns: null, rows: null, error: e.message });
        }
    };

    const handleValidate = async () => {
        if (mode !== "assisted" || !activeChallenge) return;
        setFeedback(null);
        setResult({ columns: null, rows: null, error: "Validando..." });
        try {
            // Validate
            const r = await validatePlaygroundQuery(sessionId, activeDatasetId, activeChallenge.id, query);

            // We also run the query to show the output in the table to the user
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
    };

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
