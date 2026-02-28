import React from "react";

const TYPE_COLOR = {
    INTEGER: { bg: "#eff6ff", text: "#1d4ed8" },
    DECIMAL: { bg: "#f0fdf4", text: "#15803d" },
    VARCHAR: { bg: "#fdf4ff", text: "#7e22ce" },
    DATE: { bg: "#fff7ed", text: "#c2410c" },
    TIMESTAMP: { bg: "#fff7ed", text: "#c2410c" },
    BOOLEAN: { bg: "#f0fdf4", text: "#15803d" },
    DOUBLE: { bg: "#f0fdf4", text: "#15803d" },
};

function TypeBadge({ type }) {
    const short = type?.split("(")[0].toUpperCase() || "?";
    const style = TYPE_COLOR[short] || { bg: "#f3f4f6", text: "#374151" };
    return (
        <span style={{
            display: "inline-block",
            background: style.bg,
            color: style.text,
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 6px",
            borderRadius: 4,
            letterSpacing: "0.03em",
            whiteSpace: "nowrap",
        }}>
            {short}
        </span>
    );
}

function TableCard({ table, columns }) {
    return (
        <div style={{
            marginBottom: 16,
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 10,
            overflow: "hidden",
        }}>
            <div style={{
                padding: "8px 12px",
                background: "#f8f9fa",
                borderBottom: "1px solid rgba(0,0,0,0.08)",
                display: "flex",
                alignItems: "baseline",
                gap: 10,
            }}>
                <code style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{table}</code>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <tbody>
                    {(columns || []).map((col, i) => (
                        <tr
                            key={col.name}
                            style={{ borderTop: i > 0 ? "1px solid #f5f5f5" : "none", background: "#fff" }}
                        >
                            <td style={{ padding: "6px 12px", width: "60%" }}>
                                <code style={{ fontSize: 12, color: "#1a73e8", fontWeight: 500 }}>{col.name}</code>
                            </td>
                            <td style={{ padding: "6px 12px", width: "40%", textAlign: "right" }}>
                                <TypeBadge type={col.type} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function PlaygroundSchemaPanel({ tables, schemaPrefix }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {schemaPrefix && (
                <div style={{
                    padding: "8px 12px",
                    background: "#f0f9ff",
                    border: "1px solid #e0f2fe",
                    borderRadius: "8px",
                    fontSize: 11,
                    color: "#0369a1",
                    lineHeight: 1.4
                }}>
                    💡 Sempre use o prefixo <strong>{schemaPrefix}.</strong> — ex: <code style={{ fontWeight: 600 }}>SELECT * FROM {schemaPrefix}.tabela</code>
                </div>
            )}
            <div style={{ overflowY: "auto", maxHeight: "400px", paddingRight: "4px" }}>
                {(tables || []).map((entry) => (
                    <TableCard
                        key={entry.name}
                        table={entry.name}
                        columns={entry.columns}
                    />
                ))}
            </div>
        </div>
    );
}

