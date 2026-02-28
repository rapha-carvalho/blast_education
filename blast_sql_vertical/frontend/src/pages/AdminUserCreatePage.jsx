import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createAdminUser } from "../api/client";

const STATUS_CHOICES = ["expired", "manual_grant", "blocked", "refunded", "canceled"];
const QUICK_EXPIRY_CHOICES = [
  { value: "", label: "Sem atalho" },
  { value: "30d", label: "+30 dias" },
  { value: "60d", label: "+60 dias" },
  { value: "90d", label: "+90 dias" },
  { value: "6m", label: "+6 meses" },
];

export default function AdminUserCreatePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [duplicateUserId, setDuplicateUserId] = useState(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [accessStatus, setAccessStatus] = useState("expired");
  const [quickExpiry, setQuickExpiry] = useState("");
  const [absoluteExpiry, setAbsoluteExpiry] = useState("");
  const [overallPercent, setOverallPercent] = useState("");
  const [reason, setReason] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setDuplicateUserId(null);

    const payload = {
      email: email.trim(),
      temporary_password: temporaryPassword,
      access_status: accessStatus,
    };
    if (fullName.trim()) payload.full_name = fullName.trim();
    if (reason.trim()) payload.reason = reason.trim();
    if (overallPercent !== "") payload.overall_percent = Number(overallPercent);

    if (absoluteExpiry) {
      payload.expires_at = Math.floor(new Date(absoluteExpiry).getTime() / 1000);
    } else if (quickExpiry) {
      if (quickExpiry.endsWith("d")) payload.expires_in_days = Number(quickExpiry.replace("d", ""));
      if (quickExpiry.endsWith("m")) payload.expires_in_months = Number(quickExpiry.replace("m", ""));
    }

    setSaving(true);
    try {
      const res = await createAdminUser(payload);
      navigate(`/admin/users/${res?.profile?.id}`, { replace: true });
    } catch (err) {
      const existingId = err?.payload?.detail?.existing_user_id;
      if (err?.status === 409 && existingId) {
        setDuplicateUserId(existingId);
        setError("User already exists.");
      } else {
        setError(err?.message || "Não foi possível criar usuário.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.7rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.6rem", color: "#1a1a1a", letterSpacing: "-0.03em" }}>Add user</h1>
          <p style={{ margin: "0.35rem 0 0", color: "#5f6368" }}>Cadastro manual com acesso e progresso inicial.</p>
        </div>
        <Link to="/admin/users" style={pillButtonStyle}>
          Voltar
        </Link>
      </div>

      {error ? (
        <div
          style={{
            marginTop: "0.9rem",
            border: "1px solid rgba(234,67,53,0.25)",
            background: "#fff2f1",
            color: "#b3261e",
            borderRadius: "12px",
            padding: "0.75rem 0.9rem",
          }}
        >
          {error}{" "}
          {duplicateUserId ? (
            <Link to={`/admin/users/${duplicateUserId}`} style={{ color: "#1a73e8", textDecoration: "none", fontWeight: 600 }}>
              Go to user details
            </Link>
          ) : null}
        </div>
      ) : null}

      <form
        onSubmit={submit}
        style={{
          marginTop: "0.95rem",
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: "12px",
          padding: "1rem",
          display: "grid",
          gap: "0.75rem",
        }}
      >
        <label style={labelStyle}>
          Email *
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            style={inputStyle}
            placeholder="usuario@email.com"
          />
        </label>

        <label style={labelStyle}>
          Nome
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} placeholder="Nome completo" />
        </label>

        <label style={labelStyle}>
          Senha temporaria *
          <input
            value={temporaryPassword}
            onChange={(e) => setTemporaryPassword(e.target.value)}
            style={inputStyle}
            required
            type="password"
            placeholder="Senha temporaria"
          />
        </label>

        <label style={labelStyle}>
          Status de acesso
          <select value={accessStatus} onChange={(e) => setAccessStatus(e.target.value)} style={inputStyle}>
            {STATUS_CHOICES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <label style={labelStyle}>
            Expiracao rapida
            <select
              value={quickExpiry}
              onChange={(e) => {
                setQuickExpiry(e.target.value);
                if (e.target.value) setAbsoluteExpiry("");
              }}
              style={inputStyle}
            >
              {QUICK_EXPIRY_CHOICES.map((opt) => (
                <option key={opt.value || "none"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            Expiracao absoluta
            <input
              type="datetime-local"
              value={absoluteExpiry}
              onChange={(e) => {
                setAbsoluteExpiry(e.target.value);
                if (e.target.value) setQuickExpiry("");
              }}
              style={inputStyle}
            />
          </label>
        </div>

        <label style={labelStyle}>
          Progresso inicial (%) - opcional
          <input
            type="number"
            min="0"
            max="100"
            value={overallPercent}
            onChange={(e) => setOverallPercent(e.target.value)}
            style={inputStyle}
            placeholder="0-100"
          />
        </label>

        <label style={labelStyle}>
          Motivo (opcional)
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ ...inputStyle, resize: "vertical" }}
            placeholder="Contexto para auditoria"
          />
        </label>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
          <Link to="/admin/users" style={pillButtonStyle}>
            Cancelar
          </Link>
          <button type="submit" disabled={saving} style={pillButtonStyle}>
            {saving ? "Salvando..." : "Criar usuário"}
          </button>
        </div>
      </form>
    </div>
  );
}

const labelStyle = {
  display: "grid",
  gap: "0.35rem",
  color: "#1a1a1a",
  fontSize: "0.9rem",
  fontWeight: 600,
};

const inputStyle = {
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: "10px",
  padding: "0.55rem 0.7rem",
  fontFamily: "inherit",
  fontSize: "0.9rem",
};

const pillButtonStyle = {
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: "999px",
  padding: "0.45rem 0.82rem",
  background: "#ffffff",
  color: "#1a1a1a",
  fontSize: "0.84rem",
  fontWeight: 600,
  fontFamily: "inherit",
  textDecoration: "none",
};
