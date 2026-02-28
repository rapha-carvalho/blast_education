import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, ChevronUp } from "lucide-react";
import Footer from "./Footer";
import { useAuth } from "../contexts/AuthContext";
import { stopAdminImpersonation } from "../api/client";

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
  const [mobileCoursesOpen, setMobileCoursesOpen] = useState(false);
  const [impersonationError, setImpersonationError] = useState("");
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout, replaceToken } = useAuth();
  const isAdmin = user?.role === "admin";

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
  };

  const handleStopImpersonation = async () => {
    setImpersonationError("");
    try {
      const res = await stopAdminImpersonation();
      await replaceToken(res?.admin_access_token || null);
      navigate(res?.redirect_to || "/admin/users", { replace: true });
    } catch (err) {
      setImpersonationError(err?.message || "Não foi possível encerrar a impersonacao.");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setCoursesDropdownOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setCoursesDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8f9fa" }}>
      <style>{`
        .blast-logo-container {
          display: flex;
          align-items: center;
        }
        .blast-logo {
          height: 112px; /* match blastgroup h-28 on mobile */
          width: auto;
          object-fit: contain;
          object-position: left center;
        }
        .layout-header-inner {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }
        @media (min-width: 768px) {
          .blast-logo {
            height: 144px; /* match blastgroup md:h-36 */
          }
        }
        @media (min-width: 1024px) {
          .layout-header-inner {
            padding: 0 2rem;
          }
        }
      `}</style>
      <header
        style={{
          height: "96px",
          padding: "0",
          display: "flex",
          alignItems: "center",
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,0,0,0.05)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div className="layout-header-inner">
          <a
            href="https://blastgroup.org"
            target="_blank"
            rel="noopener noreferrer"
            className="blast-logo-container"
          >
            <img
              src="/Blast_Full_Black.png"
              alt="Blast School"
              className="blast-logo"
            />
          </a>

          {/* Desktop Nav + Mobile Toggle container */}
          <div style={{ display: "flex", alignItems: "center", marginLeft: "auto" }}>
          <nav className="desktop-nav" style={{ display: "none", alignItems: "center", gap: "2rem" }}>
            <Link
              to="/"
              style={{
                fontSize: "1rem",
                fontWeight: 500,
                color: "#1a1a1a",
                textDecoration: "none",
                letterSpacing: "-0.02em",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Página principal
            </Link>
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setCoursesDropdownOpen(!coursesDropdownOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "1rem",
                  fontWeight: 500,
                  color: "#1a1a1a",
                  letterSpacing: "-0.02em",
                  fontFamily: "inherit",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Meus cursos
                <ChevronDown size={18} style={{ opacity: coursesDropdownOpen ? 0.7 : 1 }} />
              </button>
              {coursesDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: "0.5rem",
                    background: "#ffffff",
                    borderRadius: "12px",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    border: "1px solid rgba(0,0,0,0.06)",
                    padding: "0.5rem 0",
                    minWidth: "220px",
                    zIndex: 60,
                  }}
                >
                  <Link
                    to="/cursos/sql-basico-avancado"
                    onClick={() => setCoursesDropdownOpen(false)}
                    style={{
                      display: "block",
                      padding: "0.75rem 1.25rem",
                      color: "#1a1a1a",
                      textDecoration: "none",
                      fontSize: "0.95rem",
                      fontWeight: 500,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    SQL do básico ao avançado
                  </Link>
                </div>
              )}
            </div>
            <span
              style={{
                fontSize: "1rem",
                fontWeight: 500,
                color: "#9aa0a6",
                letterSpacing: "-0.02em",
                opacity: 0.6,
                cursor: "not-allowed",
              }}
            >
              Pesquisar cursos (em breve)
            </span>
            <Link
              to="/account"
              style={{
                fontSize: "1rem",
                fontWeight: 500,
                color: "#1a1a1a",
                textDecoration: "none",
                letterSpacing: "-0.02em",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Minha conta
            </Link>
            {isAdmin ? (
              <Link
                to="/admin"
                style={{
                  fontSize: "1rem",
                  fontWeight: 500,
                  color: "#1a1a1a",
                  textDecoration: "none",
                  letterSpacing: "-0.02em",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Admin
              </Link>
            ) : null}
            {user?.email && (
              <span style={{ fontSize: "0.82rem", color: "#5f6368", fontWeight: 500 }}>
                {user.email}
              </span>
            )}
            <button
              onClick={handleLogout}
              style={{
                border: "1px solid rgba(0,0,0,0.1)",
                background: "#ffffff",
                color: "#1a1a1a",
                borderRadius: "999px",
                padding: "0.45rem 0.9rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                fontFamily: "inherit",
              }}
            >
              Sair
            </button>
          </nav>

          {/* Mobile Menu Toggle */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <button
              onClick={() => setMobileMenuOpen(true)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0.5rem", color: "#1a1a1a" }}
              className="mobile-menu-btn"
            >
              <Menu size={28} />
            </button>
          </div>
          </div>
        </div>

        {/* Global CSS for hiding desktop/mobile elements */}
        <style>{`
          @media (min-width: 769px) {
            .mobile-menu-btn { display: none !important; }
            .desktop-nav { display: flex !important; margin-left: 3rem; }
          }
          @media (max-width: 768px) {
            .desktop-nav { display: none !important; }
          }
        `}</style>

        {/* Mobile Full Screen Overlay */}
        {mobileMenuOpen && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "#ffffff",
            zIndex: 100,
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{ height: "96px", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              <a href="https://blastgroup.org" className="blast-logo-container" onClick={() => setMobileMenuOpen(false)}>
                <img src="/Blast_Full_Black.png" alt="Blast School" className="blast-logo" />
              </a>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "0.5rem", color: "#1a1a1a" }}
              >
                <X size={28} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", padding: "3rem 2rem", gap: "1.5rem", flex: 1, background: "#ffffff" }}>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  textDecoration: "none",
                  letterSpacing: "-0.02em",
                }}
              >
                Página principal
              </Link>
              <div>
                <button
                  onClick={() => setMobileCoursesOpen(!mobileCoursesOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "1.5rem",
                    fontWeight: 600,
                    color: "#1a1a1a",
                    letterSpacing: "-0.02em",
                    fontFamily: "inherit",
                  }}
                >
                  Meus cursos
                  {mobileCoursesOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </button>
                {mobileCoursesOpen && (
                  <div style={{ marginTop: "1rem", paddingLeft: "0.5rem" }}>
                    <Link
                      to="/cursos/sql-basico-avancado"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: "block",
                        fontSize: "1.15rem",
                        fontWeight: 500,
                        color: "#5f6368",
                        textDecoration: "none",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      SQL do básico ao avançado
                    </Link>
                  </div>
                )}
              </div>
              <span
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "#9aa0a6",
                  letterSpacing: "-0.02em",
                  opacity: 0.6,
                  cursor: "not-allowed",
                }}
              >
                Pesquisar cursos (em breve)
              </span>
              <Link
                to="/account"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  textDecoration: "none",
                  letterSpacing: "-0.02em",
                }}
              >
                Minha conta
              </Link>
              {isAdmin ? (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 600,
                    color: "#1a1a1a",
                    textDecoration: "none",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Admin
                </Link>
              ) : null}
              {user?.email && (
                <span style={{ fontSize: "0.95rem", color: "#5f6368", marginTop: "0.4rem" }}>
                  {user.email}
                </span>
              )}
              <button
                onClick={handleLogout}
                style={{
                  marginTop: "0.25rem",
                  width: "100%",
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "#ffffff",
                  color: "#1a1a1a",
                  borderRadius: "12px",
                  padding: "0.85rem 1rem",
                  textAlign: "left",
                  fontSize: "1rem",
                  fontWeight: 600,
                  fontFamily: "inherit",
                }}
              >
                Sair da conta
              </button>
            </div>
          </div>
        )}
      </header>
      {user?.is_impersonating ? (
        <div
          style={{
            background: "#fff8e1",
            borderBottom: "1px solid rgba(245,158,11,0.28)",
            padding: "0.65rem 1.25rem",
          }}
        >
          <div
            style={{
              maxWidth: "1280px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.8rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ color: "#b06000", fontSize: "0.88rem", fontWeight: 600 }}>
              Impersonating user: {user?.email || "-"}
            </div>
            <button
              type="button"
              onClick={handleStopImpersonation}
              style={{
                border: "1px solid rgba(0,0,0,0.12)",
                background: "#ffffff",
                color: "#1a1a1a",
                borderRadius: "999px",
                padding: "0.35rem 0.75rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                fontFamily: "inherit",
              }}
            >
              Stop impersonation
            </button>
            {impersonationError ? (
              <div style={{ width: "100%", color: "#b3261e", fontSize: "0.82rem" }}>{impersonationError}</div>
            ) : null}
          </div>
        </div>
      ) : null}
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
}
