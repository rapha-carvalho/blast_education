import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import BraceParticles from "../components/BraceParticles";
import BlastEducationLogo from "../components/BlastEducationLogo";
import { resetPassword, validateResetToken } from "../api/client";

const PASSWORD_RULES = "Mínimo 10 caracteres e pelo menos 1 número ou símbolo.";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [tokenValid, setTokenValid] = useState(null);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    validateResetToken(token)
      .then((data) => setTokenValid(data.valid))
      .catch(() => setTokenValid(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (newPassword.length < 10) {
      setError(PASSWORD_RULES);
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err?.message || "Erro ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa" }}>
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (tokenValid === false || !token) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8f9fa", padding: "2rem" }}>
        <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.25rem", color: "#1a1a1a" }}>Link inválido ou expirado</h2>
        <p style={{ margin: "0 0 1.5rem 0", color: "#5f6368", textAlign: "center" }}>
          O link de redefinição de senha é inválido ou já expirou. Solicite um novo.
        </p>
        <Link to="/forgot-password" style={{ color: "#1a73e8", fontWeight: 600, textDecoration: "none" }}>Solicitar novo link</Link>
        <Link to="/login" style={{ marginTop: "1rem", color: "#5f6368", textDecoration: "none" }}>Voltar para login</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8f9fa", padding: "2rem" }}>
        <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.25rem", color: "#137333" }}>Senha redefinida</h2>
        <p style={{ margin: "0 0 1.5rem 0", color: "#5f6368", textAlign: "center" }}>
          Sua senha foi alterada com sucesso. Você já pode fazer login.
        </p>
        <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "#1a1a1a", color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "50px", fontWeight: 600, textDecoration: "none" }}>
          Ir para login
          <Lock size={16} />
        </Link>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .reset-shell { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8f9fa; padding: 2rem; }
        .reset-card { width: 100%; max-width: 420px; background: #fff; border-radius: 20px; box-shadow: 0 24px 80px rgba(0,0,0,0.12); padding: 2.5rem; }
        .reset-title { margin: 0 0 0.4rem 0; font-size: 1.5rem; font-weight: 500; color: #1a1a1a; }
        .reset-subtitle { margin: 0 0 1.5rem 0; color: #9aa0a6; font-size: 0.9rem; line-height: 1.5; }
        .reset-error { margin: 0 0 1rem 0; padding: 0.7rem 0.9rem; border-radius: 10px; border: 1px solid rgba(234,67,53,0.2); background: #fff2f1; color: #c0392b; font-size: 0.875rem; }
        .reset-field { margin-bottom: 1rem; }
        .reset-label { display: block; margin-bottom: 0.4rem; font-size: 0.85rem; font-weight: 500; color: #1a1a1a; }
        .reset-input-wrap { position: relative; }
        .reset-input-icon { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); color: #9aa0a6; }
        .reset-input { width: 100%; box-sizing: border-box; border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; padding: 0.8rem 0.875rem 0.8rem 2.75rem; font-size: 0.95rem; font-family: inherit; outline: none; }
        .reset-input:focus { border-color: #1a73e8; box-shadow: 0 0 0 3px rgba(26,115,232,0.15); }
        .reset-btn { width: 100%; padding: 0.875rem; border: none; border-radius: 50px; background: #1a1a1a; color: #fff; font-size: 0.95rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        .reset-btn:disabled { opacity: 0.65; cursor: wait; }
        .reset-spin { animation: reset-spin 0.8s linear infinite; }
        @keyframes reset-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .reset-back { display: block; margin-top: 1rem; font-size: 0.9rem; color: #1a73e8; text-decoration: none; }
      `}</style>

      <div className="reset-shell">
        <div className="reset-card">
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <BlastEducationLogo variant="black" width="160px" showLabel={false} />
          </div>
          <h2 className="reset-title">Redefinir senha</h2>
          <p className="reset-subtitle">Digite sua nova senha. {PASSWORD_RULES}</p>

          <form onSubmit={handleSubmit}>
            {error && <div className="reset-error">{error}</div>}
            <div className="reset-field">
              <label className="reset-label" htmlFor="reset-new">Nova senha</label>
              <div className="reset-input-wrap">
                <Lock size={16} className="reset-input-icon" />
                <input
                  id="reset-new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="reset-input"
                  placeholder="Nova senha"
                  autoComplete="new-password"
                  required
                  minLength={10}
                />
              </div>
            </div>
            <div className="reset-field">
              <label className="reset-label" htmlFor="reset-confirm">Confirmar nova senha</label>
              <div className="reset-input-wrap">
                <Lock size={16} className="reset-input-icon" />
                <input
                  id="reset-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="reset-input"
                  placeholder="Repita a nova senha"
                  autoComplete="new-password"
                  required
                  minLength={10}
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="reset-btn">
              {loading ? <Loader2 size={18} className="reset-spin" /> : "Redefinir senha"}
            </button>
          </form>

          <Link to="/login" className="reset-back">Voltar para login</Link>
        </div>
      </div>
    </>
  );
}
