import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, Calendar, CreditCard, AlertCircle, KeyRound } from "lucide-react";
import { changePassword, getAccountInfo, requestRefund, sendResetLink } from "../api/client";
import { uiTokens } from "../styles/uiTokens";
import { fixPtBrText } from "../utils/ptBrText";

const REFUND_REASONS = [
  { value: "", label: "Selecione um motivo (opcional)" },
  { value: "changed_mind", label: "Mudei de ideia" },
  { value: "bought_by_mistake", label: "Comprei por engano" },
  { value: "not_what_expected", label: "Não era o que esperava" },
  { value: "technical_issues", label: "Problemas técnicos" },
  { value: "other", label: "Outro" },
];

function formatDate(ts) {
  if (!ts) return null;
  return new Date(ts * 1000).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

export default function AccountPage() {
  const [account, setAccount] = useState({
    loading: true,
    data: null,
    error: null,
  });
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundError, setRefundError] = useState(null);
  const [securityCurrentPassword, setSecurityCurrentPassword] = useState("");
  const [securityNewPassword, setSecurityNewPassword] = useState("");
  const [securityConfirmPassword, setSecurityConfirmPassword] = useState("");
  const [securitySubmitting, setSecuritySubmitting] = useState(false);
  const [securityError, setSecurityError] = useState(null);
  const [securitySuccess, setSecuritySuccess] = useState(null);
  const [resetLinkSubmitting, setResetLinkSubmitting] = useState(false);
  const [resetLinkSuccess, setResetLinkSuccess] = useState(false);

  const loadAccount = async () => {
    try {
      setAccount((prev) => ({ ...prev, loading: true, error: null }));
      const data = await getAccountInfo();
      setAccount({ loading: false, data, error: null });
    } catch (err) {
      setAccount({
        loading: false,
        data: null,
        error: fixPtBrText(err?.message) || "Não foi possível carregar sua conta.",
      });
    }
  };

  useEffect(() => {
    loadAccount();
  }, []);

  const handleOpenRefundModal = () => {
    setRefundReason("");
    setRefundNotes("");
    setRefundError(null);
    setRefundModalOpen(true);
  };

  const handleCloseRefundModal = () => {
    setRefundModalOpen(false);
    setRefundError(null);
  };

  const handleOpenPolicyModal = () => setPolicyModalOpen(true);
  const handleClosePolicyModal = () => setPolicyModalOpen(false);

  const handleConfirmRefund = async () => {
    setRefundSubmitting(true);
    setRefundError(null);
    try {
      const reasonText =
        refundReason === "other"
          ? refundNotes || "Outro"
          : REFUND_REASONS.find((r) => r.value === refundReason)?.label || refundNotes || null;
      const data = await requestRefund({ reason: reasonText });
      setAccount({ loading: false, data, error: null });
      handleCloseRefundModal();
    } catch (err) {
      setRefundError(fixPtBrText(err?.message) || "Erro ao solicitar reembolso.");
    } finally {
      setRefundSubmitting(false);
    }
  };

  const handleEscape = (e) => {
    if (e.key !== "Escape") return;
    if (refundModalOpen) handleCloseRefundModal();
    else if (policyModalOpen) handleClosePolicyModal();
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSecurityError(null);
    setSecuritySuccess(null);
    if (securityNewPassword !== securityConfirmPassword) {
      setSecurityError("As senhas não coincidem.");
      return;
    }
    if (securityNewPassword.length < 10) {
      setSecurityError("A senha deve ter pelo menos 10 caracteres e incluir 1 número ou símbolo.");
      return;
    }
    setSecuritySubmitting(true);
    try {
      await changePassword(securityCurrentPassword, securityNewPassword);
      setSecuritySuccess("Senha alterada com sucesso.");
      setSecurityCurrentPassword("");
      setSecurityNewPassword("");
      setSecurityConfirmPassword("");
    } catch (err) {
      setSecurityError(fixPtBrText(err?.message) || "Erro ao alterar senha.");
    } finally {
      setSecuritySubmitting(false);
    }
  };

  const handleSendResetLink = async () => {
    setResetLinkSuccess(false);
    setResetLinkSubmitting(true);
    try {
      await sendResetLink();
      setResetLinkSuccess(true);
    } finally {
      setResetLinkSubmitting(false);
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [refundModalOpen, policyModalOpen]);

  const { loading, data, error } = account;
  const access = data?.access;
  const eligibleForRefund = Boolean(data?.eligible_for_refund);
  const refundWindowDays = data?.refund_window_days ?? 14;
  const statusLabel = fixPtBrText(access?.status_label ?? "Sem acesso");
  const statusVal = access?.status ?? "expired";

  const statusBadgeStyle =
    statusVal === "active"
      ? { color: "#137333", border: "rgba(19,115,51,0.25)", background: "#e6f4ea" }
      : statusVal === "refunded"
        ? { color: "#b3261e", border: "rgba(179,38,30,0.2)", background: "#fce8e6" }
        : { color: uiTokens.colors.textSecondary, border: uiTokens.colors.border, background: uiTokens.colors.canvas };

  return (
    <div style={{ background: uiTokens.colors.canvas, minHeight: "100vh" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "3rem 2rem 4rem" }}>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            margin: "0 0 2rem 0",
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            fontWeight: 500,
            letterSpacing: "-0.04em",
            color: uiTokens.colors.text,
          }}
        >
          Minha conta
        </motion.h1>

        {loading ? (
          <p style={{ color: uiTokens.colors.textMuted }}>Carregando...</p>
        ) : error ? (
          <p style={{ color: "#b3261e" }}>{fixPtBrText(error)}</p>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            {/* User identity */}
            <div
              style={{
                background: uiTokens.colors.surface,
                borderRadius: uiTokens.radius.lg,
                border: `1px solid ${uiTokens.colors.border}`,
                padding: "1.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: uiTokens.radius.md,
                    background: uiTokens.colors.accentSoft,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: uiTokens.colors.accent,
                  }}
                >
                  <User size={20} />
                </div>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 600, color: uiTokens.colors.text }}>
                    {fixPtBrText(data?.user?.full_name) || "Usuário"}
                  </div>
                  <div style={{ fontSize: "0.9rem", color: uiTokens.colors.textSecondary }}>
                    {data?.user?.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Access card */}
            <div
              style={{
                background: uiTokens.colors.surface,
                borderRadius: uiTokens.radius.lg,
                border: `1px solid ${uiTokens.colors.border}`,
                padding: "1.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: uiTokens.colors.text }}>
                  Acesso ao curso
                </h2>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0.35rem 0.75rem",
                    borderRadius: uiTokens.radius.pill,
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    ...statusBadgeStyle,
                  }}
                >
                  {statusLabel}
                </span>
              </div>

              {access ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {access.expires_at != null && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem", color: uiTokens.colors.textSecondary }}>
                      <Calendar size={16} />
                      Válido até: {formatDate(access.expires_at)}
                    </div>
                  )}
                  {access.purchase_at != null && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem", color: uiTokens.colors.textSecondary }}>
                      <CreditCard size={16} />
                      Comprado em: {formatDate(access.purchase_at)}
                    </div>
                  )}
                  {statusVal === "refunded" && access.refunded_at != null && (
                    <div style={{ fontSize: "0.95rem", color: uiTokens.colors.textSecondary }}>
                      Reembolsado em {formatDate(access.refunded_at)}
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "0.95rem", color: uiTokens.colors.textMuted }}>
                  Você ainda não possui acesso ao curso.
                </p>
              )}

              <p style={{ margin: "1rem 0 0 0", fontSize: "0.8rem", color: uiTokens.colors.textMuted }}>
                Reembolso disponível em até {refundWindowDays} dias após a compra.
              </p>

              {access && (
                <>
                  {eligibleForRefund ? (
                    <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem", color: uiTokens.colors.textSecondary, lineHeight: 1.5 }}>
                      Para solicitar o reembolso, clique em <strong>Cancelar compra (reembolso)</strong> abaixo. Seu acesso será revogado imediatamente e o valor será devolvido conforme a forma de pagamento original, em até 7 dias úteis.
                    </p>
                  ) : statusVal === "active" && access?.purchase_at ? (
                    <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem", color: uiTokens.colors.textSecondary, lineHeight: 1.5 }}>
                      O prazo para reembolso automático online foi encerrado. Entre em contato com o suporte em{" "}
                      <a href="https://blastgroup.org" target="_blank" rel="noopener noreferrer" style={{ color: uiTokens.colors.accent, fontWeight: 500 }}>
                        blastgroup.org
                      </a>{" "}
                      para verificar possibilidades.
                    </p>
                  ) : null}
                </>
              )}

              <p style={{ margin: "0.75rem 0 0 0", fontSize: "0.85rem" }}>
                <button
                  type="button"
                  onClick={handleOpenPolicyModal}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontFamily: "inherit",
                    fontSize: "inherit",
                    color: uiTokens.colors.accent,
                    fontWeight: 500,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Ver política de reembolso
                </button>
              </p>

              {/* Actions */}
              <div style={{ marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                {eligibleForRefund && (
                  <button
                    onClick={handleOpenRefundModal}
                    style={{
                      border: `1px solid ${uiTokens.colors.warningBorder}`,
                      background: uiTokens.colors.warningBg,
                      color: uiTokens.colors.warningText,
                      borderRadius: uiTokens.radius.pill,
                      padding: "0.6rem 1.2rem",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      fontFamily: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    Cancelar compra (reembolso)
                  </button>
                )}
                {statusVal === "active" && !eligibleForRefund && access?.purchase_at && (
                  <a
                    href="https://blastgroup.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: "0.9rem",
                      color: uiTokens.colors.accent,
                      fontWeight: 500,
                      textDecoration: "none",
                    }}
                  >
                    Reembolso indisponível online. Entre em contato com o suporte.
                  </a>
                )}
                {statusVal === "refunded" && access?.refunded_at != null && (
                  <span style={{ fontSize: "0.9rem", color: uiTokens.colors.textSecondary }}>
                    Reembolsado em {formatDate(access.refunded_at)}
                  </span>
                )}
                {statusVal === "expired" && (
                  <Link
                    to="/checkout"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      background: uiTokens.colors.accent,
                      color: "#fff",
                      borderRadius: uiTokens.radius.pill,
                      padding: "0.6rem 1.2rem",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Comprar novamente
                  </Link>
                )}
              </div>
            </div>

            {/* Security card */}
            <div
              style={{
                background: uiTokens.colors.surface,
                borderRadius: uiTokens.radius.lg,
                border: `1px solid ${uiTokens.colors.border}`,
                padding: "1.5rem",
              }}
            >
              <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: 600, color: uiTokens.colors.text, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <KeyRound size={18} />
                Segurança
              </h2>
              <form onSubmit={handleChangePassword}>
                {securityError && (
                  <p style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "#b3261e" }}>{securityError}</p>
                )}
                {securitySuccess && (
                  <p style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "#137333" }}>{securitySuccess}</p>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, color: uiTokens.colors.textSecondary, marginBottom: "0.35rem" }}>Senha atual</label>
                    <input
                      type="password"
                      value={securityCurrentPassword}
                      onChange={(e) => setSecurityCurrentPassword(e.target.value)}
                      placeholder="Senha atual"
                      autoComplete="current-password"
                      required
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.75rem",
                        borderRadius: uiTokens.radius.md,
                        border: `1px solid ${uiTokens.colors.border}`,
                        fontSize: "0.9rem",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, color: uiTokens.colors.textSecondary, marginBottom: "0.35rem" }}>Nova senha</label>
                    <input
                      type="password"
                      value={securityNewPassword}
                      onChange={(e) => setSecurityNewPassword(e.target.value)}
                      placeholder="Mín. 10 caracteres, 1 número ou símbolo"
                      autoComplete="new-password"
                      required
                      minLength={10}
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.75rem",
                        borderRadius: uiTokens.radius.md,
                        border: `1px solid ${uiTokens.colors.border}`,
                        fontSize: "0.9rem",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, color: uiTokens.colors.textSecondary, marginBottom: "0.35rem" }}>Confirmar nova senha</label>
                    <input
                      type="password"
                      value={securityConfirmPassword}
                      onChange={(e) => setSecurityConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      autoComplete="new-password"
                      required
                      minLength={10}
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.75rem",
                        borderRadius: uiTokens.radius.md,
                        border: `1px solid ${uiTokens.colors.border}`,
                        fontSize: "0.9rem",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <button
                    type="submit"
                    disabled={securitySubmitting}
                    style={{
                      border: "none",
                      background: uiTokens.colors.accent,
                      color: "#fff",
                      borderRadius: uiTokens.radius.pill,
                      padding: "0.6rem 1.2rem",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      fontFamily: "inherit",
                      cursor: securitySubmitting ? "not-allowed" : "pointer",
                    }}
                  >
                    {securitySubmitting ? "Alterando..." : "Alterar senha"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSendResetLink}
                    disabled={resetLinkSubmitting}
                    style={{
                      border: `1px solid ${uiTokens.colors.border}`,
                      background: uiTokens.colors.surface,
                      color: uiTokens.colors.textSecondary,
                      borderRadius: uiTokens.radius.pill,
                      padding: "0.6rem 1.2rem",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                      fontFamily: "inherit",
                      cursor: resetLinkSubmitting ? "not-allowed" : "pointer",
                    }}
                  >
                    {resetLinkSubmitting ? "Enviando..." : "Enviar link de redefinição para meu email"}
                  </button>
                </div>
                {resetLinkSuccess && (
                  <p style={{ margin: "1rem 0 0 0", fontSize: "0.85rem", color: "#137333" }}>
                    Se existir uma conta para seu email, enviamos um link de redefinição.
                  </p>
                )}
              </form>
            </div>
          </motion.div>
        )}
      </div>

      {/* Refund confirmation modal */}
      <AnimatePresence>
        {refundModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "1.5rem",
            }}
            onClick={(e) => e.target === e.currentTarget && handleCloseRefundModal()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="refund-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              style={{
                background: uiTokens.colors.surface,
                borderRadius: uiTokens.radius.xl,
                boxShadow: "0 24px 48px rgba(0,0,0,0.15)",
                maxWidth: "440px",
                width: "100%",
                padding: "1.5rem 1.75rem",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1rem" }}>
                <AlertCircle size={22} color={uiTokens.colors.warningText} style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <h2 id="refund-modal-title" style={{ margin: 0, fontSize: "1.15rem", fontWeight: 600, color: uiTokens.colors.text }}>
                    Confirmar reembolso
                  </h2>
                  <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem", color: uiTokens.colors.textSecondary, lineHeight: 1.5 }}>
                    Isso solicitará o reembolso e revogará seu acesso imediatamente.
                  </p>
                  {access?.expires_at != null && (
                    <p style={{ margin: "0.35rem 0 0 0", fontSize: "0.85rem", color: uiTokens.colors.textMuted }}>
                      Expiração: {formatDate(access.expires_at)}
                    </p>
                  )}
                  {access?.purchase_at != null && (
                    <p style={{ margin: "0.1rem 0 0 0", fontSize: "0.85rem", color: uiTokens.colors.textMuted }}>
                      Compra em: {formatDate(access.purchase_at)}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ marginTop: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 500, color: uiTokens.colors.textSecondary, marginBottom: "0.35rem" }}>
                  Motivo (opcional)
                </label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.75rem",
                    borderRadius: uiTokens.radius.md,
                    border: `1px solid ${uiTokens.colors.border}`,
                    fontSize: "0.9rem",
                    fontFamily: "inherit",
                    marginBottom: "0.75rem",
                  }}
                >
                  {REFUND_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {fixPtBrText(r.label)}
                    </option>
                  ))}
                </select>
                {refundReason === "other" && (
                  <textarea
                    value={refundNotes}
                    onChange={(e) => setRefundNotes(e.target.value)}
                    placeholder="Descreva o motivo..."
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      borderRadius: uiTokens.radius.md,
                      border: `1px solid ${uiTokens.colors.border}`,
                      fontSize: "0.9rem",
                      fontFamily: "inherit",
                      resize: "vertical",
                      marginBottom: "0.75rem",
                    }}
                  />
                )}
              </div>

              {refundError && (
                <p style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "#b3261e" }}>{fixPtBrText(refundError)}</p>
              )}

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
                <button
                  onClick={handleCloseRefundModal}
                  disabled={refundSubmitting}
                  style={{
                    border: `1px solid ${uiTokens.colors.border}`,
                    background: uiTokens.colors.surface,
                    color: uiTokens.colors.text,
                    borderRadius: uiTokens.radius.pill,
                    padding: "0.55rem 1.1rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    fontFamily: "inherit",
                    cursor: refundSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmRefund}
                  disabled={refundSubmitting}
                  style={{
                    border: "none",
                    background: uiTokens.colors.warningText,
                    color: "#fff",
                    borderRadius: uiTokens.radius.pill,
                    padding: "0.55rem 1.1rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    fontFamily: "inherit",
                    cursor: refundSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {refundSubmitting ? "Processando..." : "Confirmar solicitação de reembolso"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Política de Reembolso modal */}
      <AnimatePresence>
        {policyModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "1.5rem",
            }}
            onClick={(e) => e.target === e.currentTarget && handleClosePolicyModal()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="policy-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              style={{
                background: uiTokens.colors.surface,
                borderRadius: uiTokens.radius.xl,
                boxShadow: "0 24px 48px rgba(0,0,0,0.15)",
                maxWidth: "480px",
                width: "100%",
                maxHeight: "85vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: "1.5rem 1.75rem", borderBottom: `1px solid ${uiTokens.colors.border}`, flexShrink: 0 }}>
                <h2 id="policy-modal-title" style={{ margin: 0, fontSize: "1.15rem", fontWeight: 600, color: uiTokens.colors.text }}>
                  Política de Reembolso
                </h2>
              </div>
              <div
                style={{
                  padding: "1.5rem 1.75rem",
                  overflowY: "auto",
                  fontSize: "0.9rem",
                  color: uiTokens.colors.textSecondary,
                  lineHeight: 1.6,
                }}
              >
                <section style={{ marginBottom: "1rem" }}>
                  <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", fontWeight: 600, color: uiTokens.colors.text }}>1. Introdução</h3>
                  <p style={{ margin: 0 }}>
                    Esta política aplica-se à venda de produtos digitais (cursos online, conteúdos em PDF e similares). A compra está sujeita aos termos aqui descritos, em conformidade com o Código de Defesa do Consumidor (CDC) e a legislação de comércio eletrônico no Brasil.
                  </p>
                </section>
                <section style={{ marginBottom: "1rem" }}>
                  <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", fontWeight: 600, color: uiTokens.colors.text }}>2. Direito de Arrependimento</h3>
                  <p style={{ margin: 0 }}>
                    Conforme o Artigo 49 do CDC, o consumidor tem direito de arrependimento em até 7 (sete) dias corridos após a compra, contados do recebimento do produto digital, desde que não tenha acessado ou baixado o conteúdo. Caso o produto digital já tenha sido acessado ou baixado, o direito de arrependimento perde validade, pois trata-se de bem consumível e irreversível.
                  </p>
                </section>
                <section style={{ marginBottom: "1rem" }}>
                  <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", fontWeight: 600, color: uiTokens.colors.text }}>3. Como Solicitar</h3>
                  <p style={{ margin: 0 }}>
                    Quando elegível, utilize o botão &quot;Cancelar compra (reembolso)&quot; nesta página. Caso o prazo tenha encerrado, entre em contato com o suporte em{" "}
                    <a href="https://blastgroup.org" target="_blank" rel="noopener noreferrer" style={{ color: uiTokens.colors.accent, fontWeight: 500 }}>blastgroup.org</a>
                    . A solicitação deve conter: nome completo, número do pedido (se houver), data da compra e motivo.
                  </p>
                </section>
                <section style={{ marginBottom: "1rem" }}>
                  <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", fontWeight: 600, color: uiTokens.colors.text }}>4. Prazo de Processamento</h3>
                  <p style={{ margin: 0 }}>
                    O reembolso será processado em até 7 (sete) dias úteis, conforme a forma de pagamento original.
                  </p>
                </section>
                <section style={{ marginBottom: "1rem" }}>
                  <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", fontWeight: 600, color: uiTokens.colors.text }}>5. Exceções</h3>
                  <p style={{ margin: 0 }}>
                    Não serão aceitos pedidos de reembolso quando: (a) o produto digital já tiver sido acessado ou baixado; (b) o motivo for incompatibilidade com dispositivos ou software, devendo o cliente verificar os requisitos mínimos antes da compra; (c) houver insatisfação subjetiva após acesso ao conteúdo.
                  </p>
                </section>
                <section style={{ marginBottom: "1rem" }}>
                  <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", fontWeight: 600, color: uiTokens.colors.text }}>6. Problemas Técnicos</h3>
                  <p style={{ margin: 0 }}>
                    Em caso de problemas técnicos relacionados ao acesso ou uso do produto, entre em contato com o suporte. Se o problema não puder ser resolvido e for comprovado defeito no conteúdo, será feito o reenvio ou, em último caso, o reembolso integral.
                  </p>
                </section>
                <section>
                  <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", fontWeight: 600, color: uiTokens.colors.text }}>7. Recursos do Consumidor</h3>
                  <p style={{ margin: 0 }}>
                    Em caso de dificuldades, o consumidor pode recorrer ao portal{" "}
                    <a href="https://www.consumidor.gov.br" target="_blank" rel="noopener noreferrer" style={{ color: uiTokens.colors.accent, fontWeight: 500 }}>Consumidor.gov.br</a>
                    {" "}para mediação entre consumidores e empresas.
                  </p>
                </section>
              </div>
              <div style={{ padding: "1rem 1.75rem", borderTop: `1px solid ${uiTokens.colors.border}`, flexShrink: 0 }}>
                <button
                  onClick={handleClosePolicyModal}
                  style={{
                    border: "none",
                    background: uiTokens.colors.accent,
                    color: "#fff",
                    borderRadius: uiTokens.radius.pill,
                    padding: "0.55rem 1.2rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
