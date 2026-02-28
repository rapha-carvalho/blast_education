import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Loader2, Lock, Mail, ShieldCheck, Ticket } from "lucide-react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import BlastEducationLogo from "../components/BlastEducationLogo";
import BraceParticles from "../components/BraceParticles";
import { getCourses, startEmbeddedCheckout } from "../api/client";
import { fixPtBrText } from "../utils/ptBrText";

const DEFAULT_COURSE_ID = "sql-basics";
const STATIC_PUBLISHABLE_KEY = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "").trim();
const DEFAULT_MODULES = [
  { title: "SQL e o Mundo de Dados Moderno", lessons: 5 },
  { title: "Filtrando e Fatiando Dados", lessons: 6 },
  { title: "Agregando Dados", lessons: 4 },
  { title: "JOINs: Combinando Tabelas", lessons: 3 },
  { title: "Análise de Datas e Séries Temporais", lessons: 3 },
  { title: "Lógica Condicional e Qualidade de Dados", lessons: 3 },
  { title: "Subqueries e CTEs", lessons: 2 },
  { title: "Window Functions", lessons: 3 },
  { title: "Análise de Negócio Avançada", lessons: 3 },
  { title: "Performance e Boas Práticas de SQL", lessons: 2 },
  { title: "Master Challenge Final", lessons: 1 },
];

const stripePromiseCache = new Map();

function getStripePromise(publishableKey) {
  const key = (publishableKey || "").trim();
  if (!key) return null;
  if (!stripePromiseCache.has(key)) {
    stripePromiseCache.set(key, loadStripe(key));
  }
  return stripePromiseCache.get(key);
}

if (STATIC_PUBLISHABLE_KEY) {
  getStripePromise(STATIC_PUBLISHABLE_KEY);
}

function buildDefaultModuleCards() {
  return DEFAULT_MODULES.map((module, idx) => ({
    index: idx + 1,
    title: module.title,
    lessons: module.lessons,
  }));
}

function normalizeLessonCount(module, fallback = 0) {
  if (Array.isArray(module?.lessons)) return module.lessons.length;
  const parsed = Number(module?.lesson_count);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default function CheckoutStartPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [moduleCards, setModuleCards] = useState(buildDefaultModuleCards);
  const [clientSecret, setClientSecret] = useState("");
  const [publishableKey, setPublishableKey] = useState(STATIC_PUBLISHABLE_KEY);

  useEffect(() => {
    let cancelled = false;

    getCourses()
      .then((data) => {
        if (cancelled) return;
        const courses = Array.isArray(data?.courses) ? data.courses : [];
        const selected = courses.find((course) => course?.id === DEFAULT_COURSE_ID) || courses[0];
        const parsedModules = Array.isArray(selected?.modules)
          ? selected.modules
              .slice(0, 11)
              .map((module, idx) => ({
                index: idx + 1,
                title: fixPtBrText(module?.title || DEFAULT_MODULES[idx]?.title || `Módulo ${idx + 1}`),
                lessons: normalizeLessonCount(module, DEFAULT_MODULES[idx]?.lessons || 0),
              }))
              .filter((module) => Boolean(module.title))
          : [];

        if (parsedModules.length > 0) {
          setModuleCards(parsedModules);
        }
      })
      .catch(() => {
        // Mantém os módulos padrão quando o endpoint de conteúdo falha.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const stripePromise = useMemo(() => getStripePromise(publishableKey), [publishableKey]);
  const checkoutOptions = useMemo(
    () => ({
      clientSecret,
      onComplete: () => navigate("/checkout/success"),
    }),
    [clientSecret, navigate]
  );

  const moduleCount = moduleCards.length;
  const lessonCount = moduleCards.reduce((total, module) => total + (Number(module.lessons) || 0), 0);

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    if (clientSecret) setClientSecret("");
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    if (clientSecret) setClientSecret("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setError("");
    setSubmitting(true);
    try {
      const payload = await startEmbeddedCheckout({
        email: email.trim(),
        password,
        courseId: DEFAULT_COURSE_ID,
      });

      const sessionClientSecret = (payload?.client_secret || "").trim();
      const sessionPublishableKey = (payload?.publishable_key || "").trim() || STATIC_PUBLISHABLE_KEY;
      if (!sessionClientSecret) throw new Error("Não foi possível iniciar o checkout embutido.");
      if (!sessionPublishableKey) throw new Error("Chave pública Stripe ausente.");

      setClientSecret(sessionClientSecret);
      setPublishableKey(sessionPublishableKey);
    } catch (err) {
      setClientSecret("");
      setError(err?.message || "Não foi possível iniciar o pagamento.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .checkout-start-shell {
          min-height: 100vh;
          background: #ffffff;
          padding: clamp(1rem, 2.2vw, 2rem);
          box-sizing: border-box;
        }
        .checkout-start-grid {
          width: min(1440px, 100%);
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(560px, 1.2fr) minmax(430px, 1fr);
          gap: clamp(1.4rem, 2.6vw, 3rem);
          align-items: start;
          background: #ffffff;
        }
        .checkout-start-left {
          display: grid;
          gap: 1.4rem;
          background: #ffffff;
        }
        .checkout-start-hero {
          background: #ffffff;
          overflow: hidden;
          min-height: 400px;
        }
        .checkout-start-hero-copy {
          width: min(700px, 92%);
          margin: 0 auto;
          text-align: center;
        }
        .checkout-start-info {
          background: #ffffff;
          padding: 0.1rem 0;
        }
        .checkout-start-right {
          background: #ffffff;
          display: grid;
          gap: 0.95rem;
          align-content: start;
        }
        .checkout-start-title {
          margin: 0;
          font-size: clamp(1.7rem, 2.2vw, 2.25rem);
          line-height: 1.1;
          letter-spacing: -0.03em;
          color: #1a1a1a;
          font-weight: 600;
        }
        .checkout-start-subtitle {
          margin: 0;
          color: #5f6368;
          line-height: 1.55;
          font-size: 0.96rem;
          max-width: 600px;
        }
        .checkout-start-field {
          margin-top: 0.78rem;
        }
        .checkout-start-label {
          display: block;
          margin-bottom: 0.38rem;
          color: #1a1a1a;
          font-size: 0.88rem;
          font-weight: 600;
        }
        .checkout-start-input-wrap {
          position: relative;
        }
        .checkout-start-icon {
          position: absolute;
          left: 0.82rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9aa0a6;
          pointer-events: none;
        }
        .checkout-start-input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid rgba(0,0,0,0.12);
          border-radius: 12px;
          padding: 0.82rem 0.85rem 0.82rem 2.55rem;
          font-size: 0.95rem;
          font-family: inherit;
          color: #1a1a1a;
          background: #ffffff;
        }
        .checkout-start-input:focus {
          outline: none;
          border-color: #1a73e8;
          box-shadow: 0 0 0 3px rgba(26,115,232,0.15);
        }
        .checkout-start-error {
          margin: 0.65rem 0 0;
          font-size: 0.88rem;
          color: #b3261e;
        }
        .checkout-start-btn {
          margin-top: 1rem;
          border: none;
          border-radius: 999px;
          background: #1a1a1a;
          color: #ffffff;
          padding: 0.86rem 1rem;
          font-weight: 600;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .checkout-start-btn:hover:not(:disabled) {
          background: #000000;
          transform: translateY(-1px);
        }
        .checkout-start-btn:disabled {
          opacity: 0.7;
          cursor: wait;
        }
        .checkout-start-spin {
          animation: checkout-start-spin 0.8s linear infinite;
        }
        @keyframes checkout-start-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .checkout-start-links {
          margin: 0.1rem 0 0;
          color: #5f6368;
          font-size: 0.88rem;
        }
        .checkout-start-links a {
          color: #1a73e8;
          text-decoration: none;
        }
        .checkout-start-stripe-hints {
          margin-top: 0.2rem;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.9rem 1.2rem;
          color: #5f6368;
        }
        .checkout-start-stripe-hints span {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.86rem;
        }
        .checkout-start-stripe-surface {
          background: #ffffff;
          min-height: 540px;
        }
        .checkout-start-placeholder {
          min-height: 160px;
          display: grid;
          align-content: center;
          gap: 0.5rem;
          color: #5f6368;
          font-size: 0.92rem;
          line-height: 1.5;
        }
        .checkout-modules-showcase {
          display: grid;
          gap: 0.95rem;
          margin-top: 1.2rem;
        }
        .checkout-modules-pill {
          display: inline-flex;
          width: fit-content;
          padding: 0.36rem 0.78rem;
          border-radius: 999px;
          border: 1px solid #8fd9b6;
          background: #d9f5e8;
          color: #0c7f57;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .checkout-modules-title {
          margin: 0;
          font-size: clamp(1.45rem, 2.5vw, 2.2rem);
          line-height: 1.15;
          letter-spacing: -0.03em;
          color: #0f172a;
        }
        .checkout-modules-subtitle {
          margin: 0;
          color: #526071;
          font-size: 0.98rem;
          line-height: 1.6;
          max-width: 760px;
        }
        .checkout-modules-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(210px, 1fr));
          gap: 0.9rem;
          margin-top: 0.2rem;
        }
        .checkout-module-card {
          position: relative;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #dfe6ee;
          border-radius: 14px;
          padding: 0.88rem 0.95rem 0.9rem;
          min-height: 116px;
        }
        .checkout-module-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.66rem;
          position: relative;
          z-index: 2;
        }
        .checkout-module-id {
          display: inline-flex;
          align-items: center;
          border-radius: 6px;
          background: #d9f5e8;
          color: #0c7f57;
          font-size: 0.67rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.24rem 0.44rem;
        }
        .checkout-module-lessons {
          display: inline-flex;
          align-items: center;
          border-radius: 6px;
          background: #f3f6fb;
          color: #7c8ea3;
          font-size: 0.76rem;
          font-weight: 700;
          padding: 0.2rem 0.48rem;
        }
        .checkout-module-name {
          margin: 0;
          color: #1f2937;
          font-size: 1.03rem;
          line-height: 1.35;
          letter-spacing: -0.01em;
          font-weight: 600;
          position: relative;
          z-index: 2;
        }
        .checkout-module-watermark {
          position: absolute;
          right: -6px;
          bottom: -18px;
          font-size: clamp(3.1rem, 4.1vw, 4.4rem);
          line-height: 1;
          font-weight: 800;
          color: rgba(15, 23, 42, 0.05);
          pointer-events: none;
          user-select: none;
        }
        @media (max-width: 1320px) {
          .checkout-modules-grid {
            grid-template-columns: repeat(2, minmax(210px, 1fr));
          }
        }
        @media (max-width: 1220px) {
          .checkout-start-grid {
            grid-template-columns: 1fr;
          }
          .checkout-start-right {
            margin-top: 0.2rem;
          }
        }
        @media (max-width: 760px) {
          .checkout-start-shell {
            padding: 0.9rem;
          }
          .checkout-start-hero {
            min-height: 315px;
          }
          .checkout-start-hero-copy {
            width: min(740px, 96%);
          }
          .checkout-modules-grid {
            grid-template-columns: 1fr;
          }
          .checkout-start-stripe-surface {
            min-height: 500px;
          }
        }
      `}</style>

      <div className="checkout-start-shell">
        <div className="checkout-start-grid">
          <section className="checkout-start-left">
            <section className="checkout-start-hero">
              <BraceParticles>
                <div className="checkout-start-hero-copy">
                  <p
                    style={{
                      margin: "0 0 0.95rem 0",
                      fontSize: "0.84rem",
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#1a73e8",
                    }}
                  >
                    SQL DO BÁSICO AO AVANÇADO
                  </p>
                  <h1
                    style={{
                      margin: "0 0 0.85rem 0",
                      fontSize: "clamp(1.7rem, 3.55vw, 3.1rem)",
                      fontWeight: 600,
                      letterSpacing: "-0.04em",
                      lineHeight: 1.08,
                      color: "#1a1a1a",
                    }}
                  >
                    De zero queries a análises
                    <br />
                    <span style={{ color: "#5f6368" }}>complexas de negócio</span>
                  </h1>
                  <p
                    style={{
                      margin: "0 0 1.2rem 0",
                      fontSize: "clamp(0.94rem, 1.2vw, 1.08rem)",
                      color: "#5f6368",
                      fontWeight: 400,
                      lineHeight: 1.55,
                    }}
                  >
                    Aprenda SQL com datasets reais e exercícios práticos.
                    <br />
                    Foco total em aplicação no negócio.
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.9rem",
                      color: "#5f6368",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {moduleCount} módulos · {lessonCount} aulas · acesso por 6 meses
                  </p>
                </div>
              </BraceParticles>
            </section>

            <section className="checkout-start-info">
              <h2
                style={{
                  margin: 0,
                  fontSize: "clamp(1.3rem, 2.2vw, 2rem)",
                  letterSpacing: "-0.02em",
                  color: "#1a1a1a",
                }}
              >
                Informações do curso
              </h2>
              <p style={{ margin: "0.75rem 0 1rem", color: "#5f6368", lineHeight: 1.65, fontSize: "1rem" }}>
                Pagamento único com liberação automática após confirmação no webhook Stripe.
              </p>

              <div style={{ display: "grid", gap: "0.68rem", marginBottom: "1.1rem" }}>
                {[
                  "Conta criada automaticamente após pagamento aprovado",
                  "Acesso completo a toda trilha com módulo final de desafio",
                  "Cupom aceito no checkout em Adicionar código promocional",
                ].map((text) => (
                  <div key={text} style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                    <CheckCircle2 size={17} color="#1a73e8" />
                    <span style={{ color: "#1a1a1a", fontSize: "0.96rem" }}>{text}</span>
                  </div>
                ))}
              </div>

              <section className="checkout-modules-showcase">
                <span className="checkout-modules-pill">Conteúdo Programático</span>
                <h3 className="checkout-modules-title">
                  {moduleCount} módulos. {lessonCount} aulas.
                </h3>
                <p className="checkout-modules-subtitle">
                  Estruturado para analistas, não para engenheiros. Cada módulo aplica SQL a contextos reais de negócio.
                </p>

                <div className="checkout-modules-grid">
                  {moduleCards.map((module) => (
                    <article className="checkout-module-card" key={`${module.index}-${module.title}`}>
                      <div className="checkout-module-meta">
                        <span className="checkout-module-id">Módulo {String(module.index).padStart(2, "0")}</span>
                        <span className="checkout-module-lessons">
                          {module.lessons} aula{module.lessons === 1 ? "" : "s"}
                        </span>
                      </div>
                      <h4 className="checkout-module-name">{module.title}</h4>
                      <span className="checkout-module-watermark">{String(module.index).padStart(2, "0")}</span>
                    </article>
                  ))}
                </div>
              </section>
            </section>
          </section>

          <section className="checkout-start-right">
            <BlastEducationLogo
              variant="black"
              width="264px"
              showLabel={false}
              style={{ marginLeft: "-16px" }}
            />
            <h2 className="checkout-start-title">Finalizar compra</h2>
            <p className="checkout-start-subtitle">
              Crie email e senha abaixo e conclua o pagamento no mesmo passo. A conta só é criada quando o pagamento for aprovado.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="checkout-start-field">
                <label className="checkout-start-label" htmlFor="checkout-email">
                  Email
                </label>
                <div className="checkout-start-input-wrap">
                  <Mail size={16} className="checkout-start-icon" />
                  <input
                    id="checkout-email"
                    className="checkout-start-input"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="voce@email.com"
                    required
                  />
                </div>
              </div>

              <div className="checkout-start-field">
                <label className="checkout-start-label" htmlFor="checkout-password">
                  Senha
                </label>
                <div className="checkout-start-input-wrap">
                  <Lock size={16} className="checkout-start-icon" />
                  <input
                    id="checkout-password"
                    className="checkout-start-input"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Crie sua senha"
                    required
                  />
                </div>
              </div>

              {error && <p className="checkout-start-error">{error}</p>}

              <button className="checkout-start-btn" type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={16} className="checkout-start-spin" />
                    Carregando checkout...
                  </>
                ) : (
                  <>
                    Continuar para pagamento
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <p className="checkout-start-links">
              Já tem conta? <Link to="/login">Entrar</Link>
            </p>

            <div className="checkout-start-stripe-hints">
              <span>
                <ShieldCheck size={15} />
                Pagamento seguro via Stripe
              </span>
              <span>
                <Ticket size={15} />
                Cupons disponíveis no checkout
              </span>
            </div>

            <div className="checkout-start-stripe-surface">
              {clientSecret && stripePromise ? (
                <EmbeddedCheckoutProvider stripe={stripePromise} options={checkoutOptions}>
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              ) : (
                <div className="checkout-start-placeholder" aria-live="polite">
                  <p style={{ margin: 0 }}>
                    Preencha seus dados de conta e clique em Continuar para carregar o módulo de pagamento.
                  </p>
                  <p style={{ margin: 0 }}>
                    Sua conta será criada somente após a aprovação do pagamento.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
