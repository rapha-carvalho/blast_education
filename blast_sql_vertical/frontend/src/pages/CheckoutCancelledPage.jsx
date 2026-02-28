import { Link } from "react-router-dom";

export default function CheckoutCancelledPage() {
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
          Pagamento cancelado
        </h1>
        <p style={{ margin: 0, color: "#5f6368", lineHeight: 1.55 }}>
          Nenhuma cobrança foi concluída. Você pode tentar novamente quando quiser.
        </p>
        <div style={{ marginTop: "1.5rem" }}>
          <Link
            to="/checkout/sql-zero-avancado"
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
            Tentar novamente
          </Link>
        </div>
      </div>
    </div>
  );
}
