import { motion } from "framer-motion";
import { Lock } from "lucide-react";

/**
 * CertificationCard displays the completion certificate preview.
 * It becomes non-interactive while access is temporarily locked.
 */
export default function CertificationCard({ userName, onClick, locked = false, helperText = "", lockedBadgeLabel = "" }) {
  const displayName = userName?.trim() || "Participante";
  const isInteractive = Boolean(onClick) && !locked;

  return (
    <motion.div
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-disabled={locked ? true : undefined}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={(e) => {
        if (!isInteractive) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        position: "relative",
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: "16px",
        padding: "3rem 2rem",
        overflow: "hidden",
        boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
        cursor: isInteractive ? "pointer" : "default",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        opacity: locked ? 0.85 : 1,
      }}
      whileHover={isInteractive ? { boxShadow: "0 12px 40px rgba(0,0,0,0.1)", scale: 1.01 } : {}}
    >
      {locked && (
        <div
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            zIndex: 2,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "0.35rem 0.75rem",
            borderRadius: "999px",
            background: "#fff8e1",
            border: "1px solid rgba(245,158,11,0.2)",
            color: "#b06000",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          <Lock size={12} />
          {lockedBadgeLabel || "Bloqueado"}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "200px",
          height: "200px",
          opacity: 0.06,
          pointerEvents: "none",
        }}
      >
        <img
          src="/logo/Blast_Icon_Black.png"
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#1a73e8",
          }}
        >
          {"Certificado de conclus\u00e3o"}
        </span>
        <h3
          style={{
            margin: 0,
            fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
            fontWeight: 500,
            letterSpacing: "-0.03em",
            color: "#1a1a1a",
            lineHeight: 1.2,
          }}
        >
          {displayName}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "0.95rem",
            color: "#5f6368",
            fontWeight: 400,
          }}
        >
          {"SQL do b\u00e1sico ao avan\u00e7ado"}
        </p>
        {locked && helperText ? (
          <p
            style={{
              margin: 0,
              maxWidth: "520px",
              fontSize: "0.9rem",
              color: "#b06000",
              lineHeight: 1.5,
            }}
          >
            {helperText}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}
