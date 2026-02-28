import { motion } from "framer-motion";

/**
 * CertificationCard — certification display when user has completed the course
 * and meets eligibility (purchase + days since purchase).
 * Clickable to open full certificate view.
 */
export default function CertificationCard({ userName, onClick }) {
  const displayName = userName?.trim() || "Participante";

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.()}
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
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
      }}
      whileHover={onClick ? { boxShadow: "0 12px 40px rgba(0,0,0,0.1)", scale: 1.01 } : {}}
    >
      {/* Watermark: Blast icon, centered and low-opacity */}
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

      {/* Content */}
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
          Certificado de conclusão
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
          SQL do básico ao avançado
        </p>
      </div>
    </motion.div>
  );
}
