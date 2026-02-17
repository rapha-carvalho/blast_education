import { Link } from "react-router-dom";

export default function Layout({ children }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          padding: "1rem 1.5rem",
          background: "#161b22",
          borderBottom: "1px solid #30363d",
        }}
      >
        <Link
          to="/"
          style={{
            color: "#e6edf3",
            fontSize: "1.25rem",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Blast SQL
        </Link>
      </header>
      <main style={{ flex: 1, padding: "1.5rem" }}>{children}</main>
    </div>
  );
}
