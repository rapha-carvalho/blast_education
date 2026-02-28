import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        background: "#1a1a1a",
        color: "rgba(255,255,255,0.7)",
        fontFamily: "inherit",
        marginTop: "auto",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "3rem 2rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "2rem",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ marginBottom: "0.75rem" }}>
            <Link
              to="/"
              style={{
                display: "inline-block",
                textDecoration: "none",
              }}
            >
              <img
                src="/Blast_Full_White.png"
                alt="Blast School"
                style={{ height: "32px", width: "auto", display: "block" }}
              />
            </Link>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "0.9rem",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.6)",
              maxWidth: "260px",
            }}
          >
            Aprenda SQL do básico ao avançado com cursos interativos.
          </p>
        </div>
        <div>
          <div
            style={{
              marginBottom: "0.75rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Blast Group
          </div>
          <a
            href="https://blastgroup.org"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "rgba(255,255,255,0.85)",
              textDecoration: "none",
              fontSize: "0.95rem",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Site principal
          </a>
        </div>
      </div>
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "1.25rem 2rem",
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "0.85rem",
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.01em",
          }}
        >
          © {year} Blast Group
        </p>
      </div>
    </footer>
  );
}
