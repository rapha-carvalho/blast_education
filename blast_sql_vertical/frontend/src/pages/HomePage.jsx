import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Lock, Terminal } from "lucide-react";
import BraceParticles from "../components/BraceParticles";
import { getBillingAccessStatus } from "../api/client";

export default function HomePage() {
  const navigate = useNavigate();
  const [accessStatus, setAccessStatus] = useState({
    loading: true,
    hasAccess: false,
    expiresAt: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const loadAccess = async () => {
      try {
        const data = await getBillingAccessStatus();
        if (cancelled) return;
        setAccessStatus({
          loading: false,
          hasAccess: Boolean(data.has_access),
          expiresAt: data.expires_at || null,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        setAccessStatus({
          loading: false,
          hasAccess: false,
          expiresAt: null,
          error: err?.message || "Não foi possível carregar seu acesso.",
        });
      }
    };
    loadAccess();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleBuy = () => {
    navigate("/checkout");
  };

  const hasAccess = accessStatus.hasAccess;
  const expiresText = accessStatus.expiresAt
    ? new Date(accessStatus.expiresAt * 1000).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : null;

  const card = (
    <div
      style={{
        borderRadius: "20px",
        overflow: "hidden",
        background: "#111111",
        cursor: hasAccess ? "pointer" : "default",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
      }}
      onMouseEnter={(e) => {
        if (!hasAccess) return;
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 24px 64px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ position: "relative" }}>
        <BraceParticles>
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(1.35rem, 4vw, 3.5rem)",
              fontWeight: 500,
              color: "#ffffff",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              textAlign: "center",
              textShadow: "0 2px 24px rgba(0,0,0,0.7)",
            }}
          >
            SQL do básico ao avançado
          </h2>
        </BraceParticles>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "80px",
            background: "linear-gradient(to top, #111111, transparent)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
      </div>

      <div style={{ padding: "0.25rem 2.5rem 2rem", background: "#111111" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "rgba(66,133,244,0.15)",
            border: "1px solid rgba(66,133,244,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#4285F4",
            marginBottom: "1rem",
          }}
        >
          <Terminal size={18} />
        </div>

        <p
          style={{
            margin: "0 0 1.5rem 0",
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.95rem",
            fontWeight: 300,
            lineHeight: 1.5,
          }}
        >
          De zero queries a análises complexas de negócio
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <span
            style={{
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.3)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            11 módulos | 35 aulas | ~8h de conteúdo
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.55rem 1.3rem",
              background: hasAccess ? "#ffffff" : "rgba(255,255,255,0.12)",
              color: hasAccess ? "#111111" : "#ffffff",
              borderRadius: "50px",
              fontSize: "0.875rem",
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            {hasAccess ? "Acessar curso" : "Comprar acesso"} <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3.5rem 2rem 1rem" }}>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            margin: 0,
            fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
            fontWeight: 500,
            letterSpacing: "-0.04em",
            color: "#1a1a1a",
          }}
        >
          Meus cursos
        </motion.h1>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 2rem 1.5rem" }}>
        {accessStatus.loading ? (
          <p style={{ margin: 0, color: "#5f6368" }}>Verificando seu acesso...</p>
        ) : hasAccess ? (
          <p style={{ margin: 0, color: "#137333", fontWeight: 500 }}>
            Acesso ativo {expiresText ? `até ${expiresText}` : ""}.
          </p>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
            <button
              onClick={handleBuy}
              style={{
                border: "none",
                borderRadius: "999px",
                background: "#1a1a1a",
                color: "#fff",
                padding: "0.65rem 1.2rem",
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              Comprar acesso (6 meses)
            </button>
            {accessStatus.error && <span style={{ color: "#b3261e" }}>{accessStatus.error}</span>}
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
        style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 2rem 4rem" }}
      >
        {hasAccess ? (
          <Link to="/cursos/sql-basico-avancado" style={{ textDecoration: "none", display: "block" }}>
            {card}
          </Link>
        ) : (
          card
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 2rem 6rem" }}
      >
        <p
          style={{
            margin: "0 0 1.25rem 0",
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#c4c9d0",
          }}
        >
          Mais cursos chegando
        </p>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "1rem",
            padding: "1rem 1.5rem",
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.05)",
            borderRadius: "14px",
            opacity: 0.55,
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "#f8f9fa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9aa0a6",
              flexShrink: 0,
            }}
          >
            <BookOpen size={17} />
          </div>
          <div>
            <div style={{ fontSize: "0.9rem", fontWeight: 500, color: "#1a1a1a", letterSpacing: "-0.01em" }}>
              SQL para Analytics Engineers
            </div>
            <div style={{ fontSize: "0.78rem", color: "#9aa0a6", marginTop: "2px" }}>Em breve</div>
          </div>
          <Lock size={13} color="#c4c9d0" style={{ marginLeft: "0.5rem", flexShrink: 0 }} />
        </div>
      </motion.div>
    </div>
  );
}
