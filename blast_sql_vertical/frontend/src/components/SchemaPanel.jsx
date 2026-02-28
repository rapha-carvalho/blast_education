import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import { fixPtBrText } from "../utils/ptBrText";

// Badge colours for SQL types
const TYPE_COLOR = {
  INTEGER:  { bg: "#eff6ff", text: "#1d4ed8" },
  DECIMAL:  { bg: "#f0fdf4", text: "#15803d" },
  VARCHAR:  { bg: "#fdf4ff", text: "#7e22ce" },
  DATE:     { bg: "#fff7ed", text: "#c2410c" },
  BOOLEAN:  { bg: "#f0fdf4", text: "#15803d" },
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
      padding: "1px 6px",
      borderRadius: 4,
      letterSpacing: "0.03em",
      whiteSpace: "nowrap",
    }}>
      {short}
    </span>
  );
}

function TableCard({ table, description, columns }) {
  return (
    <div style={{
      marginBottom: 20,
      border: "1px solid #f0f0f0",
      borderRadius: 10,
      overflow: "hidden",
    }}>
      {/* Table header */}
      <div style={{
        padding: "10px 14px",
        background: "#f9fafb",
        borderBottom: "1px solid #f0f0f0",
        display: "flex",
        alignItems: "baseline",
        gap: 10,
      }}>
        <code style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{table}</code>
        {description && (
          <span style={{ fontSize: 11, color: "#6b7280" }}>{fixPtBrText(description)}</span>
        )}
      </div>

      {/* Columns */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#fafafa" }}>
            <th style={{ padding: "5px 14px", textAlign: "left", color: "#9ca3af", fontWeight: 500, width: "36%" }}>Coluna</th>
            <th style={{ padding: "5px 8px",  textAlign: "left", color: "#9ca3af", fontWeight: 500, width: "14%" }}>Tipo</th>
            <th style={{ padding: "5px 14px", textAlign: "left", color: "#9ca3af", fontWeight: 500 }}>Descrição</th>
          </tr>
        </thead>
        <tbody>
          {(columns || []).map((col, i) => (
            <tr
              key={col.name}
              style={{ borderTop: "1px solid #f5f5f5", background: i % 2 === 0 ? "#fff" : "#fafafa" }}
            >
              <td style={{ padding: "6px 14px" }}>
                <code style={{ fontSize: 12, color: "#1e40af", fontWeight: 500 }}>{col.name}</code>
              </td>
              <td style={{ padding: "6px 8px" }}>
                <TypeBadge type={col.type} />
              </td>
              <td style={{ padding: "6px 14px", color: "#6b7280", lineHeight: 1.4 }}>
                {fixPtBrText(col.desc)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SchemaPanel({ schemaReference, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 9998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
          width: "min(860px, 94vw)",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: "1px solid #f0f0f0",
          flexShrink: 0,
        }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
              Referência de Schema
            </span>
            <span style={{
              marginLeft: 10, fontSize: 11, fontWeight: 500,
              color: "#6b7280", background: "#f3f4f6",
              padding: "2px 8px", borderRadius: 20,
            }}>
              {schemaReference?.length ?? 0} tabelas
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 6, color: "#6b7280", display: "flex", alignItems: "center",
              borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tip bar */}
        <div style={{
          padding: "8px 20px",
          background: "#f0f9ff",
          borderBottom: "1px solid #e0f2fe",
          fontSize: 11,
          color: "#0369a1",
          flexShrink: 0,
        }}>
          💡 Use sempre o prefixo <code style={{ fontWeight: 600 }}>capstone.</code> nas suas queries — ex: <code>SELECT * FROM capstone.pedidos</code>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "20px 20px 8px", flex: 1 }}>
          {(schemaReference || []).map((entry) => (
            <TableCard
              key={entry.table}
              table={entry.table}
              description={entry.description}
              columns={entry.columns}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
