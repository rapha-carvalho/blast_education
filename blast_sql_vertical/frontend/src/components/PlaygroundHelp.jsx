import { useEffect, useState } from "react";
import { BookOpen, Code2, HelpCircle } from "lucide-react";

export default function PlaygroundHelp({ variant = "desktop" }) {
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("playground_help_collapsed");
            if (stored === "true") {
                setCollapsed(true);
            }
        } catch {
            // ignore storage errors
        }
    }, []);

    const handleToggle = () => {
        setCollapsed(prev => {
            const next = !prev;
            try {
                localStorage.setItem("playground_help_collapsed", String(next));
            } catch {
                // ignore storage errors
            }
            return next;
        });
    };

    const isMobile = variant === "mobile";

    if (collapsed && isMobile) {
        return (
            <button
                onClick={handleToggle}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "0.35rem 0.8rem",
                    borderRadius: 999,
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: "#fff",
                    color: "#1a1a1a",
                    fontSize: "0.78rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    margin: "0.5rem 1rem 0.5rem",
                }}
            >
                <HelpCircle size={13} />
                Como funciona o Playground?
            </button>
        );
    }

    return (
        <div
            style={{
                borderRadius: isMobile ? 14 : 16,
                border: "1px solid rgba(26,115,232,0.18)",
                background:
                    "linear-gradient(135deg, rgba(232,240,254,0.9), rgba(243,244,246,0.9))",
                padding: isMobile ? "0.8rem 1rem" : "1rem 1.25rem",
                marginTop: isMobile ? "0.5rem" : 0,
                marginBottom: isMobile ? "0.75rem" : "1.5rem",
                boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: isMobile ? "flex-start" : "center",
                    gap: isMobile ? "0.5rem" : "0.75rem",
                    marginBottom: "0.5rem",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 999,
                            background: "#1a73e8",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                        }}
                    >
                        <Code2 size={15} />
                    </div>
                    <div>
                        <div
                            style={{
                                fontWeight: 600,
                                fontSize: isMobile ? "0.9rem" : "1rem",
                                color: "#1a1a1a",
                            }}
                        >
                            Como funciona o Playground?
                        </div>
                        <div
                            style={{
                                fontSize: isMobile ? "0.78rem" : "0.9rem",
                                color: "#5f6368",
                                marginTop: 2,
                            }}
                        >
                            Escreva consultas SQL em bancos de dados de exemplo,
                            teste ideias com segurança e resolva desafios práticos.
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleToggle}
                    style={{
                        border: "none",
                        background: "transparent",
                        color: "#5f6368",
                        fontSize: "0.78rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        padding: 0,
                    }}
                >
                    {collapsed ? "Ver mais" : "Ocultar"}
                </button>
            </div>

            {!collapsed && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "1.1fr 1fr",
                        gap: isMobile ? "0.6rem" : "0.9rem",
                        fontSize: isMobile ? "0.78rem" : "0.88rem",
                        color: "#374151",
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ fontWeight: 600 }}>Modos de estudo</div>
                        <ul style={{ margin: 0, paddingLeft: "1.1rem", lineHeight: 1.5 }}>
                            <li>
                                <strong>Modo Livre</strong>: escreva qualquer consulta,
                                explore tabelas e teste hipóteses à vontade.
                            </li>
                            <li>
                                <strong>Desafios</strong>: resolva exercícios guiados e
                                use o botão <strong>Validar</strong> para conferir se sua
                                resposta está correta.
                            </li>
                        </ul>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ fontWeight: 600 }}>Como navegar</div>
                        <ul style={{ margin: 0, paddingLeft: "1.1rem", lineHeight: 1.5 }}>
                            <li>
                                Escolha um <strong>Banco de Dados</strong> na barra lateral
                                (ou na faixa superior no mobile).
                            </li>
                            <li>
                                Consulte o <strong>Schema</strong> para ver tabelas e
                                colunas disponíveis. Use sempre o prefixo do schema (ex:
                                <code> schema.tabela</code>).
                            </li>
                            <li>
                                Escreva sua consulta no <strong>Editor SQL</strong> e
                                clique em <strong>Rodar SQL</strong> para ver o resultado.
                            </li>
                            {isMobile ? (
                                <li>
                                    Use as abas <strong>Desafio</strong>,{" "}
                                    <strong>Schema</strong> e <strong>Editor</strong> para
                                    alternar entre explicação, estrutura das tabelas e
                                    código. Os botões de <strong>Rodar SQL</strong> e{" "}
                                    <strong>Validar</strong> ficam sempre na parte de baixo
                                    da tela.
                                </li>
                            ) : (
                                <li>
                                    Abaixo do editor, veja <strong>erros</strong> de SQL,
                                    feedback dos desafios e a tabela de{" "}
                                    <strong>resultados</strong> da sua consulta.
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            )}

            {!collapsed && !isMobile && (
                <div
                    style={{
                        marginTop: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: "0.8rem",
                        color: "#6b7280",
                    }}
                >
                    <BookOpen size={13} />
                    Dica: comece explorando uma tabela simples no modo livre e depois
                    migre para os desafios para consolidar o aprendizado.
                </div>
            )}
        </div>
    );
}

