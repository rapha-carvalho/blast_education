import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const REDIRECT_MS = 3500;

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login?payment=confirmed", { replace: true });
    }, REDIRECT_MS);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "#f8f9fa",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "620px",
          borderRadius: "16px",
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.08)",
          padding: "2rem",
        }}
      >
        <h1 style={{ margin: "0 0 0.75rem", fontSize: "1.6rem", letterSpacing: "-0.02em", color: "#1a1a1a" }}>
          Pagamento recebido
        </h1>
        <p style={{ margin: 0, color: "#5f6368", lineHeight: 1.55 }}>
          Obrigado. A confirmação final é feita via webhook. Você será redirecionado para o login em instantes.
        </p>
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link
            to="/login?payment=confirmed"
            style={{
              display: "inline-flex",
              textDecoration: "none",
              padding: "0.65rem 1rem",
              borderRadius: "999px",
              background: "#1a1a1a",
              color: "#fff",
              fontWeight: 500,
            }}
          >
            Ir para login
          </Link>
          <Link
            to="/checkout/sql-zero-avancado"
            style={{
              display: "inline-flex",
              textDecoration: "none",
              padding: "0.65rem 1rem",
              borderRadius: "999px",
              border: "1px solid rgba(0,0,0,0.12)",
              color: "#1a1a1a",
              fontWeight: 500,
            }}
          >
            Comprar novamente
          </Link>
        </div>
      </div>
    </div>
  );
}
