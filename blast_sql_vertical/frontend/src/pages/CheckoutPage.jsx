import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, ShieldCheck, Ticket } from "lucide-react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { motion } from "framer-motion";
import BraceParticles from "../components/BraceParticles";
import { createEmbeddedCheckoutSession, getCourses } from "../api/client";
import { fixPtBrText } from "../utils/ptBrText";

const COURSE_ID = "sql-basics";
const STATIC_PUBLISHABLE_KEY = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "").trim();

const DEFAULT_MODULE_NAMES = [
  "SQL e o Mundo de Dados Moderno",
  "Filtrando e Fatiando Dados",
  "Agregando Dados",
  "JOINs: Combinando Tabelas",
  "Análise de Datas e Séries Temporais",
  "Lógica Condicional e Qualidade de Dados",
  "Subqueries e CTEs",
  "Window Functions",
  "Análise de Negócio Avançada",
  "Performance e Boas Práticas de SQL",
  "Master Challenge Final",
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

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState("");
  const [publishableKey, setPublishableKey] = useState(STATIC_PUBLISHABLE_KEY);
  const [error, setError] = useState(null);
  const [moduleNames, setModuleNames] = useState(DEFAULT_MODULE_NAMES);
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 760;
  });

  useEffect(() => {
    let cancelled = false;

    const initCheckout = async () => {
      try {
        const session = await createEmbeddedCheckoutSession(COURSE_ID);
        if (cancelled) return;

        const sessionClientSecret = (session?.client_secret || "").trim();
        const sessionPublishableKey = (session?.publishable_key || "").trim();
        const resolvedPublishableKey = sessionPublishableKey || STATIC_PUBLISHABLE_KEY;

        if (!sessionClientSecret) {
          throw new Error("Sessão Stripe sem client secret.");
        }
        if (!resolvedPublishableKey) {
          throw new Error("Chave pública Stripe ausente.");
        }

        setClientSecret(sessionClientSecret);
        setPublishableKey(resolvedPublishableKey);
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || "Não foi possível preparar o checkout.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initCheckout();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    getCourses()
      .then((data) => {
        if (cancelled) return;
        const courses = Array.isArray(data?.courses) ? data.courses : [];
        const selected = courses.find((course) => course?.id === COURSE_ID) || courses[0];
        const names = Array.isArray(selected?.modules)
          ? selected.modules
              .map((module) => fixPtBrText(module?.title || ""))
              .filter(Boolean)
              .slice(0, 11)
          : [];
        if (names.length > 0) {
          setModuleNames(names);
        }
      })
      .catch(() => {
        // Keep defaults.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setIsMobileViewport(window.innerWidth <= 760);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const stripePromise = useMemo(() => getStripePromise(publishableKey), [publishableKey]);

  const checkoutOptions = useMemo(
    () => ({
      clientSecret,
      onComplete: () => navigate("/checkout/success"),
    }),
    [clientSecret, navigate]
  );

  const heroCopy = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="checkout-hero-copy"
      style={{ textAlign: "center", padding: "0 clamp(0.5rem, 2vw, 1.5rem)" }}
    >
      <p
        style={{
          margin: "0 0 1rem 0",
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
        className="checkout-hero-title"
        style={{
          margin: "0 0 0.9rem 0",
          fontSize: "clamp(2rem, 4.3vw, 4rem)",
          fontWeight: 500,
          letterSpacing: "-0.04em",
          lineHeight: 1.05,
          color: "#1a1a1a",
        }}
      >
        De zero queries a análises
        <br />
        <span style={{ color: "#5f6368" }}>complexas de negócio</span>
      </h1>

      <p
        className="checkout-hero-subtitle"
        style={{
          margin: "0 0 1.35rem 0",
          fontSize: "clamp(1rem, 1.4vw, 1.16rem)",
          color: "#9aa0a6",
          fontWeight: 300,
          lineHeight: 1.55,
        }}
      >
        Aprenda SQL de forma prática com datasets reais e exercícios interativos.
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "0.9rem",
          color: "#5f6368",
          letterSpacing: "0.02em",
        }}
      >
        11 módulos · 35 aulas · acesso por 6 meses
      </p>
    </motion.div>
  );

  return (
    <div style={{ background: "#ffffff", minHeight: "calc(100vh - 96px)", padding: "2rem clamp(1rem, 3vw, 2.5rem) 4rem" }}>
      <style>{`
        .checkout-shell {
          width: min(98vw, 1840px);
          margin: 0 auto;
        }
        .checkout-grid {
          display: grid;
          grid-template-columns: minmax(640px, 1.18fr) minmax(580px, 1fr);
          gap: 2.8rem;
          align-items: start;
        }
        .checkout-left {
          display: grid;
          gap: 1.6rem;
        }
        .checkout-stripe-surface {
          background: #ffffff;
          min-height: 760px;
        }
        .stripe-loading {
          display: grid;
          gap: 0.75rem;
          padding-top: 0.5rem;
        }
        .stripe-skeleton {
          background: linear-gradient(90deg, #f4f6f8 20%, #e9edf1 50%, #f4f6f8 80%);
          background-size: 200% 100%;
          animation: stripe-skeleton 1.2s linear infinite;
          border-radius: 8px;
        }
        .stripe-skeleton.title { height: 18px; width: 52%; }
        .stripe-skeleton.line { height: 14px; width: 86%; }
        .stripe-skeleton.box { height: 520px; width: 100%; border-radius: 14px; }
        @keyframes stripe-skeleton {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .checkout-module-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0.42rem 1rem;
        }
        @media (max-width: 1480px) {
          .checkout-grid {
            grid-template-columns: minmax(540px, 1.08fr) minmax(520px, 1fr);
            gap: 2rem;
          }
          .checkout-stripe-surface {
            min-height: 680px;
          }
        }
        @media (max-width: 1210px) {
          .checkout-shell {
            width: min(100vw, 900px);
          }
          .checkout-grid {
            grid-template-columns: 1fr;
            gap: 1.4rem;
          }
          .checkout-stripe-surface {
            min-height: 620px;
          }
        }
        @media (max-width: 760px) {
          .checkout-main {
            padding-top: 1rem !important;
          }
          .checkout-left {
            gap: 0.75rem;
          }
          .checkout-hero-copy {
            padding: 0 0.3rem !important;
          }
          .checkout-hero-title {
            font-size: clamp(1.42rem, 7.1vw, 1.95rem) !important;
            margin: 0 0 0.62rem 0 !important;
            line-height: 1.12 !important;
          }
          .checkout-hero-subtitle {
            font-size: 0.9rem !important;
            margin: 0 0 0.85rem 0 !important;
          }
          .checkout-stripe-surface {
            min-height: 560px;
          }
          .checkout-module-grid {
            grid-template-columns: 1fr;
            gap: 0.35rem;
          }
          .checkout-details-summary {
            cursor: pointer;
            color: #1a1a1a;
            font-weight: 600;
            margin-bottom: 0.65rem;
          }
        }
      `}</style>

      <div className="checkout-shell checkout-main">
        <div className="checkout-grid">
          <div className="checkout-left">
            <section style={{ background: "#ffffff", overflow: "hidden" }}>
              <BraceParticles>{heroCopy}</BraceParticles>
            </section>

            <section style={{ background: "#ffffff", padding: "0.2rem 0.1rem" }}>
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
                Pagamento único com liberação automática após confirmação do webhook.
              </p>

              <div style={{ display: "grid", gap: "0.68rem", marginBottom: "1.15rem" }}>
                {[
                  "Acesso imediato após pagamento confirmado",
                  "Conteúdo completo com módulos, aulas e trilha prática",
                  "Suporte a cupons com código promocional Stripe",
                ].map((text) => (
                  <div key={text} style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                    <CheckCircle2 size={17} color="#1a73e8" />
                    <span style={{ color: "#1a1a1a", fontSize: "0.96rem" }}>{text}</span>
                  </div>
                ))}
              </div>

              {isMobileViewport ? (
                <details>
                  <summary className="checkout-details-summary">Módulos incluídos ({moduleNames.length})</summary>
                  <div className="checkout-module-grid">
                    {moduleNames.map((moduleName, idx) => (
                      <div key={`${idx}-${moduleName}`} style={{ color: "#3c4043", fontSize: "0.92rem", lineHeight: 1.45 }}>
                        {idx + 1}. {moduleName}
                      </div>
                    ))}
                  </div>
                </details>
              ) : (
                <>
                  <h3 style={{ margin: "0 0 0.7rem", color: "#1a1a1a", fontSize: "1.02rem" }}>
                    Módulos incluídos ({moduleNames.length})
                  </h3>
                  <div className="checkout-module-grid">
                    {moduleNames.map((moduleName, idx) => (
                      <div key={`${idx}-${moduleName}`} style={{ color: "#3c4043", fontSize: "0.92rem", lineHeight: 1.45 }}>
                        {idx + 1}. {moduleName}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>

          <section style={{ background: "#ffffff" }}>
            <div
              style={{
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.8rem",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", color: "#5f6368" }}>
                <ShieldCheck size={16} />
                <span style={{ fontSize: "0.93rem" }}>Pagamento seguro processado pela Stripe</span>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", color: "#5f6368" }}>
                <Ticket size={16} />
                <span style={{ fontSize: "0.9rem" }}>
                  Tem cupom? Use "Adicionar código promocional" no checkout.
                </span>
              </div>
            </div>

            <div className="checkout-stripe-surface">
              {loading && (
                <div className="stripe-loading" aria-live="polite">
                  <div className="stripe-skeleton title" />
                  <div className="stripe-skeleton line" />
                  <div className="stripe-skeleton box" />
                </div>
              )}

              {!loading && error && (
                <div style={{ display: "grid", gap: "0.9rem" }}>
                  <p style={{ margin: 0, color: "#b3261e", fontWeight: 500 }}>{error}</p>
                  <Link to="/" style={{ display: "inline-flex", width: "fit-content", color: "#1a73e8", padding: "0.2rem 0" }}>
                    Voltar para home
                  </Link>
                </div>
              )}

              {!loading && !error && stripePromise && clientSecret && (
                <EmbeddedCheckoutProvider stripe={stripePromise} options={checkoutOptions}>
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
