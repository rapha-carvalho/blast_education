import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getAdminUserDetail,
  refreshAdminUserStripe,
  startAdminImpersonation,
  updateAdminUser,
  updateAdminUserProgress,
} from "../api/client";
import { useAuth } from "../contexts/AuthContext";

const STATUS_CHOICES = ["active", "expired", "refunded", "canceled", "blocked", "manual_grant"];

function formatDateTime(ts) {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function completedLessonIdsFromDetail(detail) {
  const output = [];
  for (const mod of detail?.progress?.modules || []) {
    for (const lesson of mod.lessons || []) {
      if (lesson?.is_completed) output.push(lesson.lesson_id);
    }
  }
  return output;
}

export default function AdminUserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { replaceToken } = useAuth();
  const numericUserId = useMemo(() => Number(userId), [userId]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [data, setData] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("status");
  const [statusValue, setStatusValue] = useState("active");
  const [extendDays, setExtendDays] = useState("30");
  const [expiresAtInput, setExpiresAtInput] = useState("");
  const [reason, setReason] = useState("");

  const [overallPercent, setOverallPercent] = useState("");
  const [overallReason, setOverallReason] = useState("");
  const [lessonReason, setLessonReason] = useState("");
  const [selectedLessons, setSelectedLessons] = useState(new Set());

  const [impersonationModalOpen, setImpersonationModalOpen] = useState(false);
  const [impersonationReason, setImpersonationReason] = useState("");

  const loadDetail = async () => {
    if (!Number.isFinite(numericUserId) || numericUserId <= 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await getAdminUserDetail(numericUserId);
      setData(res);
      setStatusValue(res?.access?.status || "active");
      setOverallPercent((res?.progress?.completion_pct ?? 0).toFixed(1));
      setSelectedLessons(new Set(completedLessonIdsFromDetail(res)));
    } catch (err) {
      setError(err?.message || "Não foi possível carregar dados do usuário.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericUserId]);

  const openModal = (mode) => {
    setModalMode(mode);
    setReason("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setReason("");
  };

  const runUpdate = async () => {
    const payload = { reason: reason.trim() };
    if (!payload.reason) {
      setError("Informe um motivo para a alteracao.");
      return;
    }
    if (modalMode === "status") {
      payload.status = statusValue;
    } else if (modalMode === "extend") {
      payload.extend_days = Number(extendDays);
    } else if (modalMode === "expires") {
      if (!expiresAtInput) {
        setError("Selecione uma data de expiracao.");
        return;
      }
      payload.expires_at = Math.floor(new Date(expiresAtInput).getTime() / 1000);
    }

    setSaving(true);
    setError("");
    try {
      const res = await updateAdminUser(numericUserId, payload);
      setData(res);
      setToast("Alteracao salva com sucesso.");
      closeModal();
    } catch (err) {
      setError(err?.message || "Falha ao atualizar usuário.");
    } finally {
      setSaving(false);
    }
  };

  const runRefreshStripe = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await refreshAdminUserStripe(numericUserId);
      setToast(res.override_preserved ? "Refresh feito (override admin preservado)." : "Refresh com Stripe concluído.");
      await loadDetail();
    } catch (err) {
      setError(err?.message || "Falha ao atualizar dados via Stripe.");
    } finally {
      setSaving(false);
    }
  };

  const runOverallProgressUpdate = async () => {
    const pct = Number(overallPercent);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      setError("Informe um percentual entre 0 e 100.");
      return;
    }
    if (!overallReason.trim()) {
      setError("Informe um motivo para atualizar o progresso.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await updateAdminUserProgress(numericUserId, {
        overall_percent: pct,
        reason: overallReason.trim(),
      });
      setData(res);
      setSelectedLessons(new Set(completedLessonIdsFromDetail(res)));
      setToast("Progresso geral atualizado.");
    } catch (err) {
      setError(err?.message || "Falha ao atualizar progresso.");
    } finally {
      setSaving(false);
    }
  };

  const runLessonProgressUpdate = async () => {
    if (!lessonReason.trim()) {
      setError("Informe um motivo para atualizar o progresso.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await updateAdminUserProgress(numericUserId, {
        completed_lesson_ids: Array.from(selectedLessons),
        reason: lessonReason.trim(),
      });
      setData(res);
      setOverallPercent((res?.progress?.completion_pct ?? 0).toFixed(1));
      setToast("Progresso por aula atualizado.");
    } catch (err) {
      setError(err?.message || "Falha ao atualizar progresso.");
    } finally {
      setSaving(false);
    }
  };

  const toggleLesson = (lessonId) => {
    setSelectedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  };

  const runImpersonation = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await startAdminImpersonation(numericUserId, impersonationReason.trim() || null);
      await replaceToken(res?.impersonation_access_token || null);
      navigate(res?.redirect_to || "/", { replace: true });
    } catch (err) {
      setError(err?.message || "Falha ao iniciar impersonacao.");
    } finally {
      setSaving(false);
      setImpersonationModalOpen(false);
      setImpersonationReason("");
    }
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.65rem", letterSpacing: "-0.03em", color: "#1a1a1a" }}>Detalhes do usuário</h1>
          <p style={{ margin: "0.35rem 0 0", color: "#5f6368" }}>ID {numericUserId}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link to="/admin/users" style={pillButtonStyle}>
            Voltar
          </Link>
          <button type="button" onClick={runRefreshStripe} disabled={saving} style={pillButtonStyle}>
            Refresh Stripe
          </button>
          <button type="button" onClick={() => setImpersonationModalOpen(true)} disabled={saving} style={pillButtonStyle}>
            Impersonate
          </button>
        </div>
      </div>

      {toast ? (
        <div
          style={{
            marginTop: "0.8rem",
            border: "1px solid rgba(19,115,51,0.25)",
            background: "rgba(19,115,51,0.08)",
            color: "#137333",
            borderRadius: "12px",
            padding: "0.7rem 0.9rem",
          }}
        >
          {toast}
        </div>
      ) : null}

      {error ? (
        <div
          style={{
            marginTop: "0.8rem",
            border: "1px solid rgba(234,67,53,0.25)",
            background: "#fff2f1",
            color: "#b3261e",
            borderRadius: "12px",
            padding: "0.7rem 0.9rem",
          }}
        >
          {error}
        </div>
      ) : null}

      {loading ? <p style={{ color: "#5f6368", marginTop: "1rem" }}>Carregando...</p> : null}

      {!loading && data ? (
        <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "0.8rem" }}>
          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Perfil</h2>
            <InfoRow label="Nome" value={data.profile.full_name || "-"} />
            <InfoRow label="Email" value={data.profile.email} />
            <InfoRow label="Criado em" value={formatDateTime(data.profile.created_at)} />
            <InfoRow label="Último login" value={formatDateTime(data.profile.last_login_at)} />
          </section>

          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Acesso</h2>
            <InfoRow label="Status" value={data.access.status} />
            <InfoRow label="Status efetivo" value={data.access.effective_status} />
            <InfoRow label="Expiracao" value={formatDateTime(data.access.expires_at)} />
            <InfoRow label="Gerenciado por" value={data.access.access_managed_by} />
            <InfoRow label="Atualizado em" value={formatDateTime(data.access.access_updated_at)} />
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.8rem" }}>
              <button type="button" onClick={() => openModal("status")} style={actionBtnStyle}>
                Editar status
              </button>
              <button type="button" onClick={() => openModal("extend")} style={actionBtnStyle}>
                Estender expiracao
              </button>
              <button type="button" onClick={() => openModal("expires")} style={actionBtnStyle}>
                Definir expiracao
              </button>
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Pagamento / Stripe</h2>
            <InfoRow label="Status pagamento" value={data.payment.latest_purchase_status || "-"} />
            <InfoRow label="Pago em" value={formatDateTime(data.payment.latest_paid_at)} />
            <InfoRow label="Reembolsado em" value={formatDateTime(data.payment.latest_refunded_at)} />
            <InfoRow label="Stripe customer" value={data.payment.stripe_customer_id || "-"} />
            <InfoRow label="Payment intent" value={data.payment.stripe_payment_intent_id || "-"} />
            <InfoRow label="Checkout session" value={data.payment.stripe_checkout_session_id || "-"} />
          </section>

          <section style={{ ...sectionStyle, gridColumn: "1 / -1" }}>
            <h2 style={sectionTitleStyle}>Progresso</h2>
            <InfoRow
              label="Resumo"
              value={`${(data.progress.completion_pct || 0).toFixed(1)}% (${data.progress.completed_lessons}/${data.progress.total_lessons})`}
            />
            <div style={{ marginTop: "0.9rem", display: "grid", gap: "0.85rem" }}>
              <div style={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: "10px", padding: "0.7rem" }}>
                <strong style={{ color: "#1a1a1a", fontSize: "0.9rem" }}>Option 1: Overall progress %</strong>
                <div style={{ display: "grid", gap: "0.45rem", marginTop: "0.5rem" }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={overallPercent}
                    onChange={(e) => setOverallPercent(e.target.value)}
                    style={fieldStyle}
                  />
                  <textarea
                    rows={2}
                    value={overallReason}
                    onChange={(e) => setOverallReason(e.target.value)}
                    placeholder="Motivo da alteracao"
                    style={{ ...fieldStyle, resize: "vertical" }}
                  />
                  <div>
                    <button type="button" onClick={runOverallProgressUpdate} disabled={saving} style={actionBtnStyle}>
                      Salvar progresso %
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: "10px", padding: "0.7rem" }}>
                <strong style={{ color: "#1a1a1a", fontSize: "0.9rem" }}>Option 2: Progress by module/lesson</strong>
                <div style={{ marginTop: "0.5rem", maxHeight: "360px", overflow: "auto", display: "grid", gap: "0.55rem" }}>
                  {(data.progress.modules || []).map((mod) => (
                    <div key={mod.module_id} style={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: "8px", padding: "0.6rem" }}>
                      <div style={{ fontWeight: 600, color: "#1a1a1a", fontSize: "0.86rem", marginBottom: "0.35rem" }}>{mod.module_title}</div>
                      <div style={{ display: "grid", gap: "0.3rem" }}>
                        {(mod.lessons || []).map((lesson) => (
                          <label key={lesson.lesson_id} style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "#1a1a1a", fontSize: "0.84rem" }}>
                            <input
                              type="checkbox"
                              checked={selectedLessons.has(lesson.lesson_id)}
                              onChange={() => toggleLesson(lesson.lesson_id)}
                            />
                            {lesson.lesson_title}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "0.55rem", display: "grid", gap: "0.45rem" }}>
                  <textarea
                    rows={2}
                    value={lessonReason}
                    onChange={(e) => setLessonReason(e.target.value)}
                    placeholder="Motivo da alteracao"
                    style={{ ...fieldStyle, resize: "vertical" }}
                  />
                  <div>
                    <button type="button" onClick={runLessonProgressUpdate} disabled={saving} style={actionBtnStyle}>
                      Salvar progresso por aula
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Atividade</h2>
            <InfoRow label="Último login" value={formatDateTime(data.activity.last_login_at)} />
            <div style={{ marginTop: "0.6rem", display: "grid", gap: "0.4rem" }}>
              {(data.activity.sessions || []).map((s) => (
                <div key={s.id} style={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: "10px", padding: "0.55rem 0.65rem" }}>
                  <div style={{ fontSize: "0.8rem", color: "#5f6368" }}>Sessão #{s.id}</div>
                  <div style={{ fontSize: "0.82rem", color: "#1a1a1a" }}>Criada: {formatDateTime(s.created_at)}</div>
                  <div style={{ fontSize: "0.82rem", color: "#1a1a1a" }}>Última atividade: {formatDateTime(s.last_seen_at)}</div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ ...sectionStyle, gridColumn: "1 / -1" }}>
            <h2 style={sectionTitleStyle}>Auditoria</h2>
            {(data.audit_logs || []).length === 0 ? (
              <p style={{ color: "#5f6368", margin: 0 }}>Nenhuma ação registrada.</p>
            ) : (
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {(data.audit_logs || []).map((entry) => (
                  <div key={entry.id} style={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: "10px", padding: "0.6rem 0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.6rem", flexWrap: "wrap" }}>
                      <strong style={{ color: "#1a1a1a", fontSize: "0.87rem" }}>{entry.action_type}</strong>
                      <span style={{ color: "#5f6368", fontSize: "0.8rem" }}>{formatDateTime(entry.created_at)}</span>
                    </div>
                    <div style={{ marginTop: "0.3rem", color: "#5f6368", fontSize: "0.82rem" }}>Motivo: {entry.reason}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {modalOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: "1rem",
          }}
        >
          <div style={{ width: "100%", maxWidth: "520px", background: "#ffffff", borderRadius: "14px", padding: "1rem 1rem 1.1rem" }}>
            <h3 style={{ margin: "0 0 0.8rem 0", color: "#1a1a1a" }}>
              {modalMode === "status" ? "Alterar status" : modalMode === "extend" ? "Estender expiracao" : "Definir expiracao"}
            </h3>

            {modalMode === "status" ? (
              <select
                value={statusValue}
                onChange={(e) => setStatusValue(e.target.value)}
                style={{ width: "100%", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "0.55rem 0.7rem", fontFamily: "inherit" }}
              >
                {STATUS_CHOICES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            ) : null}

            {modalMode === "extend" ? (
              <input
                type="number"
                min="1"
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
                placeholder="Quantidade de dias"
                style={{ width: "100%", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "0.55rem 0.7rem", fontFamily: "inherit" }}
              />
            ) : null}

            {modalMode === "expires" ? (
              <input
                type="datetime-local"
                value={expiresAtInput}
                onChange={(e) => setExpiresAtInput(e.target.value)}
                style={{ width: "100%", border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "0.55rem 0.7rem", fontFamily: "inherit" }}
              />
            ) : null}

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo da alteracao"
              rows={4}
              style={{
                marginTop: "0.75rem",
                width: "100%",
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: "10px",
                padding: "0.55rem 0.7rem",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.75rem" }}>
              <button type="button" onClick={closeModal} style={pillButtonStyle} disabled={saving}>
                Cancelar
              </button>
              <button type="button" onClick={runUpdate} style={pillButtonStyle} disabled={saving}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {impersonationModalOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 210,
            padding: "1rem",
          }}
        >
          <div style={{ width: "100%", maxWidth: "560px", background: "#ffffff", borderRadius: "14px", padding: "1rem 1rem 1.1rem" }}>
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#1a1a1a" }}>Impersonate user</h3>
            <p style={{ margin: "0 0 0.6rem", color: "#5f6368", fontSize: "0.9rem" }}>
              You will browse the platform as this user. All actions will be performed as them.
            </p>
            <textarea
              rows={3}
              value={impersonationReason}
              onChange={(e) => setImpersonationReason(e.target.value)}
              placeholder="Motivo (opcional)"
              style={{ ...fieldStyle, resize: "vertical" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.7rem" }}>
              <button type="button" onClick={() => setImpersonationModalOpen(false)} style={pillButtonStyle} disabled={saving}>
                Cancelar
              </button>
              <button type="button" onClick={runImpersonation} style={pillButtonStyle} disabled={saving}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "0.55rem", fontSize: "0.88rem", marginTop: "0.4rem" }}>
      <span style={{ color: "#5f6368" }}>{label}</span>
      <span style={{ color: "#1a1a1a", wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

const sectionStyle = {
  background: "#ffffff",
  border: "1px solid rgba(0,0,0,0.06)",
  borderRadius: "12px",
  padding: "0.9rem 1rem",
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: "1rem",
  color: "#1a1a1a",
};

const actionBtnStyle = {
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: "999px",
  padding: "0.42rem 0.75rem",
  background: "#ffffff",
  color: "#1a1a1a",
  fontSize: "0.82rem",
  fontWeight: 600,
  fontFamily: "inherit",
};

const pillButtonStyle = {
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: "999px",
  padding: "0.45rem 0.82rem",
  background: "#ffffff",
  color: "#1a1a1a",
  fontSize: "0.84rem",
  fontWeight: 600,
  fontFamily: "inherit",
  textDecoration: "none",
};

const fieldStyle = {
  width: "100%",
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: "10px",
  padding: "0.55rem 0.7rem",
  fontFamily: "inherit",
};
