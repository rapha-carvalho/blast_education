import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import BraceParticles from "../components/BraceParticles";
import BlastEducationLogo from "../components/BlastEducationLogo";
import { forgotPassword } from "../api/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      await forgotPassword(email.trim());
      setSuccess(true);
    } catch {
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .forgot-shell { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8f9fa; padding: 2rem; }
        .forgot-grid { width: 100%; max-width: 960px; display: grid; grid-template-columns: 1fr 1fr; border-radius: 20px; overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,0.12); }
        .forgot-left { background: #111111; display: flex; flex-direction: column; }
        .forgot-left-particles { position: relative; flex: 1; display: flex; align-items: center; justify-content: center; }
        .forgot-left-gradient { position: absolute; bottom: 0; left: 0; right: 0; height: 80px; background: linear-gradient(to top, #111111, transparent); pointer-events: none; z-index: 2; }
        .forgot-right { background: #ffffff; padding: 3rem 2.5rem; display: flex; flex-direction: column; justify-content: center; }
        .forgot-title { margin: 0 0 0.4rem 0; font-size: 1.75rem; font-weight: 500; letter-spacing: -0.03em; color: #1a1a1a; }
        .forgot-subtitle { margin: 0 0 1rem 0; color: #9aa0a6; font-size: 0.95rem; line-height: 1.5; }
        .forgot-success { margin: 0 0 1rem 0; padding: 0.7rem 0.9rem; border-radius: 10px; border: 1px solid rgba(19,115,51,0.2); background: rgba(19,115,51,0.06); color: #137333; font-size: 0.88rem; line-height: 1.4; }
        .forgot-field { margin-bottom: 1rem; }
        .forgot-label { display: block; margin-bottom: 0.4rem; font-size: 0.85rem; font-weight: 500; color: #1a1a1a; }
        .forgot-input-wrap { position: relative; }
        .forgot-input-icon { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); color: #9aa0a6; pointer-events: none; }
        .forgot-input { width: 100%; box-sizing: border-box; border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; padding: 0.8rem 0.875rem 0.8rem 2.75rem; font-size: 0.95rem; font-family: inherit; background: #ffffff; color: #1a1a1a; outline: none; }
        .forgot-input:focus { border-color: #1a73e8; box-shadow: 0 0 0 3px rgba(26,115,232,0.15); }
        .forgot-btn { width: 100%; margin-top: 0.5rem; padding: 0.875rem 1rem; border: none; border-radius: 50px; background: #1a1a1a; color: #ffffff; font-size: 0.95rem; font-weight: 500; font-family: inherit; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer; }
        .forgot-btn:disabled { opacity: 0.65; cursor: wait; }
        .forgot-spin { animation: forgot-spin 0.8s linear infinite; }
        @keyframes forgot-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .forgot-back { margin-top: 1rem; font-size: 0.9rem; color: #1a73e8; text-decoration: none; }
        @media (max-width: 767px) {
          .forgot-shell { padding: 0; background: #fff; }
          .forgot-grid { grid-template-columns: 1fr; border-radius: 0; box-shadow: none; }
          .forgot-left { min-height: 200px; }
          .forgot-right { padding: 2rem 1.5rem; }
        }
      `}</style>

      <div className="forgot-shell">
        <div className="forgot-grid">
          <div className="forgot-left">
            <div className="forgot-left-particles">
              <BraceParticles>
                <div style={{ display: "grid", justifyItems: "center", padding: "0 1rem" }}>
                  <BlastEducationLogo variant="white" height="clamp(76px, 9.6vw, 116px)" />
                </div>
              </BraceParticles>
              <div className="forgot-left-gradient" />
            </div>
          </div>
          <div className="forgot-right">
            <BlastEducationLogo variant="black" width="170px" style={{ marginBottom: "2rem" }} />
            <h2 className="forgot-title">Esqueceu a senha?</h2>
            <p className="forgot-subtitle">Informe seu email e enviaremos um link para redefinir sua senha.</p>

            {success ? (
              <div className="forgot-success">
                Se existir uma conta para este email, enviamos um link para redefinição de senha.
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="forgot-field">
                  <label className="forgot-label" htmlFor="forgot-email">Email</label>
                  <div className="forgot-input-wrap">
                    <Mail size={16} className="forgot-input-icon" />
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="forgot-input"
                      placeholder="voce@empresa.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="forgot-btn">
                  {loading ? <Loader2 size={18} className="forgot-spin" /> : "Enviar link de redefinição"}
                </button>
              </form>
            )}

            <Link to="/login" className="forgot-back">
              Voltar para login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
