import { AlertTriangle } from "lucide-react";
import { translateSqlError } from "../utils/sqlErrorTranslator";
import { fixPtBrText } from "../utils/ptBrText";

/**
 * Error assistant — translates raw SQL engine errors into PT-BR explanations
 * and actionable suggestions. Shown for Run and Validate errors when SQL editor is visible.
 */
export default function SqlErrorCard({ rawError }) {
  if (!rawError || typeof rawError !== "string") return null;

  const translated = translateSqlError(rawError);
  if (!translated) return null;

  const { title, explanation, suggestions } = translated;

  return (
    <div
      style={{
        marginBottom: 12,
        padding: "1rem 1.1rem",
        background: "#fef7f0",
        border: "1px solid #ea4335",
        borderRadius: 10,
        color: "#1a1a1a",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <AlertTriangle size={20} color="#c5221f" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#c5221f", marginBottom: 4 }}>
            {fixPtBrText(title)}
          </div>
          <div style={{ fontSize: "0.9rem", lineHeight: 1.5, color: "#3c4043" }}>
            {fixPtBrText(explanation)}
          </div>
        </div>
      </div>
      {Array.isArray(suggestions) && suggestions.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 6, color: "#5f6368" }}>
            Sugestoes:
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: "0.88rem", lineHeight: 1.6, color: "#5f6368" }}>
            {suggestions.map((s, i) => (
              <li key={i}>{fixPtBrText(s)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
