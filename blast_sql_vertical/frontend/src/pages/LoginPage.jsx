import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, Lock, Mail } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import BraceParticles from "../components/BraceParticles";
import BlastEducationLogo from "../components/BlastEducationLogo";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectPath = useMemo(() => location.state?.from?.pathname || "/", [location.state]);
  const paymentConfirmed = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("payment") === "confirmed";
  }, [location.search]);

  useEffect(() => {
    if (isAuthenticated) navigate(redirectPath, { replace: true });
  }, [isAuthenticated, navigate, redirectPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || "Não foi possível entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .login-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          padding: 2rem;
        }
        .login-grid {
          width: 100%;
          max-width: 960px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 24px 80px rgba(0,0,0,0.12);
        }
        .login-left {
          background: #111111;
          display: flex;
          flex-direction: column;
        }
        .login-left-particles {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-left-gradient {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 80px;
          background: linear-gradient(to top, #111111, transparent);
          pointer-events: none;
          z-index: 2;
        }
        .login-left-footer {
          padding: 1.5rem 2.5rem 2rem;
        }
        .login-left-footer p {
          margin: 0;
          color: rgba(255,255,255,0.2);
          font-size: 0.78rem;
          letter-spacing: 0.02em;
        }

        .login-right {
          background: #ffffff;
          padding: 3rem 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .login-title {
          margin: 0 0 0.4rem 0;
          font-size: 1.75rem;
          font-weight: 500;
          letter-spacing: -0.03em;
          color: #1a1a1a;
        }
        .login-subtitle {
          margin: 0 0 1rem 0;
          color: #9aa0a6;
          font-size: 0.95rem;
          font-weight: 300;
          line-height: 1.5;
        }
        .login-info {
          margin: 0 0 1rem 0;
          padding: 0.7rem 0.9rem;
          border-radius: 10px;
          border: 1px solid rgba(19,115,51,0.2);
          background: rgba(19,115,51,0.06);
          color: #137333;
          font-size: 0.88rem;
          line-height: 1.4;
        }

        .login-buy-btn {
          margin-bottom: 1rem;
          width: 100%;
          border-radius: 50px;
          border: none;
          color: #ffffff;
          text-decoration: none;
          padding: 0.85rem 1rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          font-weight: 600;
          background: #1a73e8;
        }
        .login-buy-btn-secondary {
          margin-top: 0.75rem;
          width: 100%;
          border-radius: 50px;
          border: 1px solid rgba(0,0,0,0.12);
          color: #1a1a1a;
          text-decoration: none;
          padding: 0.8rem 1rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          font-weight: 500;
        }

        .login-field {
          margin-bottom: 1rem;
        }
        .login-label {
          display: block;
          margin-bottom: 0.4rem;
          font-size: 0.85rem;
          font-weight: 500;
          color: #1a1a1a;
        }
        .login-input-wrap {
          position: relative;
        }
        .login-input-icon {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9aa0a6;
          pointer-events: none;
        }
        .login-input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 12px;
          padding: 0.8rem 0.875rem 0.8rem 2.75rem;
          font-size: 0.95rem;
          font-family: inherit;
          background: #ffffff;
          color: #1a1a1a;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .login-input:focus {
          border-color: #1a73e8;
          box-shadow: 0 0 0 3px rgba(26,115,232,0.15);
        }
        .login-input::placeholder {
          color: #c4c9d0;
        }

        .login-error {
          margin-bottom: 1rem;
          padding: 0.7rem 0.9rem;
          border-radius: 10px;
          border: 1px solid rgba(234,67,53,0.2);
          background: #fff2f1;
          color: #c0392b;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .login-btn {
          width: 100%;
          margin-top: 0.5rem;
          padding: 0.875rem 1rem;
          border: none;
          border-radius: 50px;
          background: #1a1a1a;
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 500;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .login-btn:hover:not(:disabled) {
          background: #000000;
          transform: translateY(-1px);
        }
        .login-btn:disabled {
          opacity: 0.65;
          cursor: wait;
        }
        .login-spin {
          animation: login-spin 0.8s linear infinite;
        }
        @keyframes login-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .login-hint {
          margin: 1.1rem 0 0 0;
          color: #9aa0a6;
          font-size: 0.8rem;
          font-weight: 300;
          line-height: 1.5;
        }

        @media (max-width: 767px) {
          .login-shell {
            padding: 0;
            background: #ffffff;
          }
          .login-grid {
            grid-template-columns: 1fr;
            border-radius: 0;
            box-shadow: none;
            min-height: 100vh;
          }
          .login-left {
            display: flex;
            min-height: 240px;
          }
          .login-left-footer {
            display: none;
          }
          .login-right {
            padding: 2rem 1.5rem 2.4rem;
            justify-content: flex-start;
          }
        }
      `}</style>

      <div className="login-shell">
        <div className="login-grid">
          <div className="login-left">
            <div className="login-left-particles">
              <BraceParticles>
                <div style={{ display: "grid", justifyItems: "center", padding: "0 1rem" }}>
                  <BlastEducationLogo
                    variant="white"
                    height="clamp(76px, 9.6vw, 116px)"
                    style={{ alignItems: "center" }}
                  />
                </div>
              </BraceParticles>
              <div className="login-left-gradient" />
            </div>
            <div className="login-left-footer">
              <p>Plataforma de ensino interativo</p>
            </div>
          </div>

          <div className="login-right">
            <BlastEducationLogo variant="black" width="170px" style={{ marginBottom: "2.25rem" }} />
            <h2 className="login-title">Entrar na conta</h2>
            <p className="login-subtitle">Use seu email e senha para acessar os cursos.</p>

            <Link to="/checkout/sql-zero-avancado" className="login-buy-btn">
              Comprar curso
              <ArrowRight size={15} />
            </Link>

            {paymentConfirmed && (
              <div className="login-info">
                Pagamento confirmado. Faça login para liberar seu acesso.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {error && <div className="login-error">{error}</div>}

              <div className="login-field">
                <label className="login-label" htmlFor="login-email">Email</label>
                <div className="login-input-wrap">
                  <Mail size={16} className="login-input-icon" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-input"
                    placeholder="voce@empresa.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="login-password">Senha</label>
                <div className="login-input-wrap">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-input"
                    placeholder="Sua senha"
                    autoComplete="current-password"
                    required
                  />
                </div>
                <Link to="/forgot-password" style={{ fontSize: "0.85rem", color: "#1a73e8", textDecoration: "none", marginTop: "0.35rem", display: "inline-block" }}>
                  Esqueceu a senha?
                </Link>
              </div>

              <button type="submit" disabled={loading} className="login-btn">
                {loading ? (
                  <Loader2 size={18} className="login-spin" />
                ) : (
                  <>
                    <span>Entrar</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <Link to="/checkout/sql-zero-avancado" className="login-buy-btn-secondary">
              Comprar curso
              <ArrowRight size={15} />
            </Link>

            <p className="login-hint">
              Ainda não tem conta? A conta é criada automaticamente após pagamento confirmado.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
