import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Modal that displays the full certificate when user clicks the card.
 */
export default function CertificationModal({ open, onClose, userName, onDownloadPdf }) {
  const displayName = userName?.trim() || "Participante";

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

  return (
    <AnimatePresence>
      {open && (
      <motion.div
        key="certification-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: "2rem",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "relative",
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "20px",
            padding: "4rem 3rem",
            maxWidth: "600px",
            width: "100%",
            boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
            overflow: "hidden",
          }}
        >
          {/* Watermark */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "240px",
              height: "240px",
              opacity: 0.06,
              pointerEvents: "none",
            }}
          >
            <img
              src="/logo/Blast_Icon_Black.png"
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
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
              gap: "1rem",
            }}
          >
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#1a73e8",
              }}
            >
              Certificado de conclusão
            </span>
            <h2
              style={{
                margin: 0,
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 500,
                letterSpacing: "-0.03em",
                color: "#1a1a1a",
                lineHeight: 1.2,
              }}
            >
              {displayName}
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "1.05rem",
                color: "#5f6368",
                fontWeight: 400,
              }}
            >
              SQL do básico ao avançado
            </p>
            {onDownloadPdf && (
              <button
                onClick={onDownloadPdf}
                style={{
                  marginTop: "0.5rem",
                  padding: "0.55rem 1.25rem",
                  background: "#1a73e8",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50px",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Baixar PDF
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.5rem",
              color: "#9aa0a6",
              padding: "0.25rem",
              lineHeight: 1,
            }}
            aria-label="Fechar"
          >
            ×
          </button>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
