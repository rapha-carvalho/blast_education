import { ChevronDown, ChevronUp, Database } from "lucide-react";
import { fixPtBrText } from "../utils/ptBrText";

function getSchemaPrefix(schemaReference) {
  const firstTable = schemaReference?.[0]?.table;
  if (!firstTable || !String(firstTable).includes(".")) return null;
  return String(firstTable).split(".")[0];
}

function TablePreviewCard({ entry, compact = false }) {
  const columns = Array.isArray(entry?.columns) ? entry.columns : [];
  const visibleColumns = columns.slice(0, compact ? 4 : 5);
  const hiddenCount = Math.max(columns.length - visibleColumns.length, 0);

  return (
    <div
      style={{
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 12,
        background: "#fff",
        padding: compact ? "0.8rem" : "0.9rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <code
          style={{
            fontSize: compact ? 11 : 12,
            fontWeight: 700,
            color: "#1a1a1a",
            wordBreak: "break-word",
          }}
        >
          {entry.table}
        </code>
        <span
          style={{
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 700,
            color: "#137333",
            background: "#e6f4ea",
            borderRadius: 999,
            padding: "0.15rem 0.5rem",
          }}
        >
          {columns.length} colunas
        </span>
      </div>

      {entry.description && (
        <div
          style={{
            fontSize: 12,
            lineHeight: 1.45,
            color: "#5f6368",
            marginBottom: 10,
          }}
        >
          {fixPtBrText(entry.description)}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {visibleColumns.map((column) => (
          <span
            key={`${entry.table}-${column.name}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.28rem 0.5rem",
              borderRadius: 999,
              background: "#f8fafc",
              border: "1px solid rgba(0,0,0,0.06)",
              fontSize: 11,
              color: "#374151",
            }}
          >
            <code style={{ fontWeight: 600 }}>{column.name}</code>
          </span>
        ))}
        {hiddenCount > 0 && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.28rem 0.5rem",
              borderRadius: 999,
              background: "#f3f4f6",
              fontSize: 11,
              color: "#6b7280",
              fontWeight: 600,
            }}
          >
            +{hiddenCount} no schema completo
          </span>
        )}
      </div>
    </div>
  );
}

export default function SchemaQuickAccess({
  schemaReference,
  expanded,
  onToggleExpanded,
  onOpenModal,
  compact = false,
}) {
  const tables = Array.isArray(schemaReference) ? schemaReference : [];
  const schemaPrefix = getSchemaPrefix(tables);
  const previewTables = tables.slice(0, compact ? 3 : 4);

  if (!tables.length) return null;

  return (
    <div
      style={{
        padding: compact ? "0.85rem 1rem 1rem" : "1rem",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 10, minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: compact ? 36 : 40,
              height: compact ? 36 : 40,
              borderRadius: 12,
              background: "#e8f0fe",
              color: "#1a73e8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Database size={compact ? 16 : 18} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: compact ? 13 : 14,
                fontWeight: 700,
                color: "#1a1a1a",
                marginBottom: 3,
              }}
            >
              Consulte a base desta atividade
            </div>
            <div
              style={{
                fontSize: compact ? 12 : 12.5,
                lineHeight: 1.45,
                color: "#5f6368",
              }}
            >
              Veja as tabelas e colunas sem sair do desafio.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={onOpenModal}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              minHeight: compact ? 38 : 40,
              padding: compact ? "0.5rem 0.9rem" : "0.55rem 1rem",
              borderRadius: 999,
              border: "none",
              background: "#1a73e8",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Ver tabelas e colunas
          </button>

          <button
            onClick={onToggleExpanded}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              minHeight: compact ? 38 : 40,
              padding: compact ? "0.5rem 0.85rem" : "0.55rem 0.95rem",
              borderRadius: 999,
              border: "1px solid rgba(0,0,0,0.12)",
              background: "#fff",
              color: "#1a1a1a",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {expanded ? "Ocultar resumo" : "Mostrar resumo"}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        {tables.map((entry) => (
          <span
            key={entry.table}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              maxWidth: "100%",
              padding: "0.32rem 0.6rem",
              borderRadius: 999,
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.08)",
              color: "#374151",
              fontSize: 11.5,
            }}
          >
            <code style={{ fontWeight: 700, wordBreak: "break-word" }}>{entry.table}</code>
            <span style={{ color: "#6b7280", whiteSpace: "nowrap" }}>
              {Array.isArray(entry.columns) ? entry.columns.length : 0} colunas
            </span>
          </span>
        ))}
      </div>

      {schemaPrefix && (
        <div
          style={{
            marginTop: 12,
            padding: "0.65rem 0.8rem",
            borderRadius: 10,
            background: "#f0f9ff",
            border: "1px solid #e0f2fe",
            color: "#0369a1",
            fontSize: 11.5,
            lineHeight: 1.5,
          }}
        >
          Use sempre o prefixo <code style={{ fontWeight: 700 }}>{schemaPrefix}.</code> nas suas queries.
        </div>
      )}

      {expanded && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: compact ? "1fr" : "repeat(2, minmax(0, 1fr))",
            gap: 10,
            marginTop: 12,
          }}
        >
          {previewTables.map((entry) => (
            <TablePreviewCard
              key={`${entry.table}-preview`}
              entry={entry}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
}
