import { motion } from "framer-motion";
import { Lock, LockOpen } from "lucide-react";

export default function ExerciseActions({
  onRun,
  onValidate,
  onHint,
  onSolution,
  onContinue,
  canContinue = false,
  showHintButton = true,
  hintLocked = false,
  solutionLocked = false,
}) {
  const btn = (label, onClick, variant = "primary", disabled = false, { lockIcon = false } = {}) => {
    let bg = "#1a1a1a";
    let color = "#ffffff";
    let hoverBg = "#333333";

    if (disabled) {
      bg = "#e8eaed";
      color = "#9aa0a6";
      hoverBg = "#e8eaed";
    } else if (variant === "secondary") {
      bg = "#f1f3f4";
      color = "#5f6368";
      hoverBg = "#e8eaed";
    } else if (variant === "accent") {
      bg = "#1a73e8";
      color = "#ffffff";
      hoverBg = "#1557b0";
    }

    return (
      <motion.button
        onClick={disabled ? undefined : onClick}
        whileHover={!disabled ? { scale: 1.02, backgroundColor: hoverBg } : undefined}
        whileTap={!disabled ? { scale: 0.98 } : undefined}
        disabled={disabled}
        title={
          disabled && label === "Ver Solução"
            ? "Desbloqueie após 2 tentativas incorretas."
            : disabled && label === "Dica"
            ? "Desbloqueie após a primeira execução com erro."
            : undefined
        }
        style={{
          padding: "0.6rem 1.2rem",
          borderRadius: "8px",
          border: "none",
          fontWeight: 600,
          background: bg,
          color: color,
          marginRight: "0.5rem",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "background-color 0.2s ease",
          opacity: disabled ? 0.7 : 1,
        }}
      >
        {lockIcon && (
          <span style={{ display: "inline-flex", alignItems: "center", marginRight: "0.4rem", verticalAlign: "middle" }}>
            {disabled ? <Lock size={14} /> : <LockOpen size={14} />}
          </span>
        )}
        {label}
      </motion.button>
    );
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
      {btn("Executar", onRun, "primary")}
      {btn("Verificar", onValidate, "accent")}
      {showHintButton && onHint ? btn("Dica", onHint, "secondary", hintLocked, { lockIcon: true }) : null}
      {btn("Ver Solução", onSolution, "secondary", solutionLocked, { lockIcon: true })}
      {canContinue && onContinue ? btn("Continuar →", onContinue, "accent") : null}
    </div>
  );
}
