import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminStats } from "../api/client";

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: "14px",
        padding: "1rem 1.1rem",
      }}
    >
      <div style={{ fontSize: "0.8rem", color: "#5f6368", marginBottom: "0.4rem" }}>{label}</div>
      <div style={{ fontSize: "1.35rem", fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.02em" }}>{value}</div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getAdminStats();
        if (cancelled) return;
        setStats(data);
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || "Não foi possível carregar estatísticas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const statusCounts = stats?.status_counts || {};

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1.4rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.8rem", letterSpacing: "-0.03em", color: "#1a1a1a" }}>Admin</h1>
          <p style={{ margin: "0.45rem 0 0", color: "#5f6368" }}>Visão geral de usuários e acesso.</p>
        </div>
        <Link
          to="/admin/users"
          style={{
            border: "1px solid rgba(0,0,0,0.1)",
            background: "#ffffff",
            color: "#1a1a1a",
            borderRadius: "999px",
            padding: "0.55rem 1rem",
            fontSize: "0.9rem",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Ver usuários
        </Link>
      </div>

      {loading ? <p style={{ color: "#5f6368" }}>Carregando...</p> : null}
      {error ? (
        <div
          style={{
            border: "1px solid rgba(234,67,53,0.25)",
            background: "#fff2f1",
            color: "#b3261e",
            borderRadius: "12px",
            padding: "0.8rem 1rem",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      ) : null}

      {!loading && !error && stats ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "0.8rem",
              marginBottom: "1rem",
            }}
          >
            <StatCard label="Total de usuários" value={stats.total_users || 0} />
            <StatCard label="Ativos (7 dias)" value={stats.active_last_7d || 0} />
            <StatCard label="Ativos (30 dias)" value={stats.active_last_30d || 0} />
            <StatCard label="Expiram em 7 dias" value={stats.expirations_next_7d || 0} />
            <StatCard label="Expiram em 14 dias" value={stats.expirations_next_14d || 0} />
            <StatCard label="Expiram em 30 dias" value={stats.expirations_next_30d || 0} />
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: "14px",
              padding: "1rem 1.1rem",
            }}
          >
            <div style={{ fontSize: "0.9rem", color: "#5f6368", marginBottom: "0.75rem" }}>Distribuicao por status</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "0.7rem",
              }}
            >
              {["active", "expired", "refunded", "canceled", "blocked", "manual_grant"].map((statusKey) => (
                <div
                  key={statusKey}
                  style={{
                    border: "1px solid rgba(0,0,0,0.06)",
                    borderRadius: "10px",
                    padding: "0.7rem 0.8rem",
                    background: "#f8f9fa",
                  }}
                >
                  <div style={{ color: "#5f6368", fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {statusKey}
                  </div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 600, marginTop: "0.25rem", color: "#1a1a1a" }}>
                    {statusCounts[statusKey] || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
