import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { uiTokens } from "../styles/uiTokens";

/**
 * Modal to collect full name for certificate generation.
 * Validates: required, min 6 chars, at least 2 words.
 */
export default function FullNameCertificateModal({ open, onClose, onSubmit }) {
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFullName("");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const validate = () => {
    const normalized = fullName.trim().replace(/\s+/g, " ");
    if (!normalized) {
      setError("Nome completo é obrigatório.");
      return null;
    }
    if (normalized.length < 6) {
      setError("Nome muito curto. Informe nome e sobrenome.");
      return null;
    }
    const words = normalized.split(/\s+/).filter(Boolean);
    if (words.length < 2) {
      setError("Informe nome e sobrenome (pelo menos duas palavras).");
      return null;
    }
    setError(null);
    return normalized;
  };

  const handleSubmit = async () => {
    const valid = validate();
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(valid);
      setSubmitting(false);
    } catch (err) {
      setError(err?.message || "Erro ao salvar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
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
          onClick={(e) => e.target === e.currentTarget && handleCancel()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="fullname-modal-title"
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
            <h2
              id="fullname-modal-title"
              style={{ margin: "0 0 0.5rem 0", fontSize: "1.15rem", fontWeight: 600, color: uiTokens.colors.text }}
            >
              Seu nome no certificado
            </h2>
            <p
              style={{
                margin: "0 0 1.25rem 0",
                fontSize: "0.9rem",
                color: uiTokens.colors.textSecondary,
                lineHeight: 1.5,
              }}
            >
              Para emitir seu certificado, precisamos do seu nome completo.
            </p>

            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: uiTokens.colors.textSecondary,
                  marginBottom: "0.35rem",
                }}
              >
                Nome completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setError(null);
                }}
                placeholder="Ex: Raphael Carvalho Bernardino"
                autoFocus
                style={{
                  width: "100%",
                  padding: "0.6rem 0.75rem",
                  borderRadius: uiTokens.radius.md,
                  border: `1px solid ${uiTokens.colors.border}`,
                  fontSize: "0.9rem",
                  fontFamily: "inherit",
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>

            {error && (
              <p style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "#b3261e" }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
              <button
                onClick={handleCancel}
                disabled={submitting}
                style={{
                  border: `1px solid ${uiTokens.colors.border}`,
                  background: uiTokens.colors.surface,
                  color: uiTokens.colors.text,
                  borderRadius: uiTokens.radius.pill,
                  padding: "0.55rem 1.1rem",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  border: "none",
                  background: uiTokens.colors.accent,
                  color: "#fff",
                  borderRadius: uiTokens.radius.pill,
                  padding: "0.55rem 1.1rem",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Salvando..." : "Salvar e gerar certificado"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
