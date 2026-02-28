import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminUsers } from "../api/client";

function formatDateTime(ts) {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos status" },
  { value: "active", label: "active" },
  { value: "expired", label: "expired" },
  { value: "refunded", label: "refunded" },
  { value: "canceled", label: "canceled" },
  { value: "blocked", label: "blocked" },
  { value: "manual_grant", label: "manual_grant" },
];

const EXPIRES_WINDOW_OPTIONS = [
  { value: "", label: "Sem filtro de expiracao" },
  { value: "next_7d", label: "Expira em 7 dias" },
  { value: "next_14d", label: "Expira em 14 dias" },
  { value: "next_30d", label: "Expira em 30 dias" },
];

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({ items: [], page: 1, page_size: 20, total_items: 0, total_pages: 0 });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expiresWindow, setExpiresWindow] = useState("");
  const [progressMin, setProgressMin] = useState("");
  const [progressMax, setProgressMax] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const queryParams = useMemo(
    () => ({
      search,
      status: statusFilter,
      expires_window: expiresWindow,
      progress_min: progressMin,
      progress_max: progressMax,
      sort_by: sortBy,
      sort_dir: sortDir,
      page,
      page_size: pageSize,
    }),
    [search, statusFilter, expiresWindow, progressMin, progressMax, sortBy, sortDir, page, pageSize]
  );

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      const run = async () => {
        setLoading(true);
        setError("");
        try {
          const res = await getAdminUsers(queryParams);
          if (cancelled) return;
          setData(res);
        } catch (err) {
          if (cancelled) return;
          setError(err?.message || "Não foi possível carregar usuários.");
        } finally {
          if (!cancelled) setLoading(false);
        }
      };
      run();
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [queryParams]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir(field === "created_at" ? "desc" : "asc");
    }
    setPage(1);
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1.1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.7rem", letterSpacing: "-0.03em", color: "#1a1a1a" }}>Usuários</h1>
          <p style={{ margin: "0.35rem 0 0", color: "#5f6368" }}>{data.total_items || 0} registros</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link
            to="/admin/users/new"
            style={{
              border: "1px solid rgba(0,0,0,0.1)",
              background: "#ffffff",
              color: "#1a1a1a",
              borderRadius: "999px",
              padding: "0.5rem 0.95rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Add user
          </Link>
          <Link
            to="/admin"
            style={{
              border: "1px solid rgba(0,0,0,0.1)",
              background: "#ffffff",
              color: "#1a1a1a",
              borderRadius: "999px",
              padding: "0.5rem 0.95rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Voltar ao dashboard
          </Link>
        </div>
      </div>

      <div
        style={{
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: "12px",
          padding: "0.9rem",
          marginBottom: "0.9rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.6rem",
        }}
      >
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por nome ou email"
          style={{
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: "10px",
            padding: "0.55rem 0.7rem",
            fontFamily: "inherit",
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "0.55rem 0.7rem", fontFamily: "inherit" }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value || "all-status"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={expiresWindow}
          onChange={(e) => {
            setExpiresWindow(e.target.value);
            setPage(1);
          }}
          style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "0.55rem 0.7rem", fontFamily: "inherit" }}
        >
          {EXPIRES_WINDOW_OPTIONS.map((opt) => (
            <option key={opt.value || "all-exp"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          value={progressMin}
          onChange={(e) => {
            setProgressMin(e.target.value);
            setPage(1);
          }}
          placeholder="Progresso min %"
          type="number"
          min="0"
          max="100"
          style={{
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: "10px",
            padding: "0.55rem 0.7rem",
            fontFamily: "inherit",
          }}
        />
        <input
          value={progressMax}
          onChange={(e) => {
            setProgressMax(e.target.value);
            setPage(1);
          }}
          placeholder="Progresso max %"
          type="number"
          min="0"
          max="100"
          style={{
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: "10px",
            padding: "0.55rem 0.7rem",
            fontFamily: "inherit",
          }}
        />
      </div>

      {error ? (
        <div
          style={{
            border: "1px solid rgba(234,67,53,0.25)",
            background: "#fff2f1",
            color: "#b3261e",
            borderRadius: "12px",
            padding: "0.75rem 0.9rem",
            marginBottom: "0.8rem",
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: "12px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "980px" }}>
          <thead>
            <tr style={{ background: "#f8f9fa" }}>
              <th style={thStyle}>Usuário</th>
              <th style={{ ...thStyle, cursor: "pointer" }} onClick={() => toggleSort("last_login_at")}>
                Último login
              </th>
              <th style={{ ...thStyle, cursor: "pointer" }} onClick={() => toggleSort("progress_pct")}>
                Progresso
              </th>
              <th style={{ ...thStyle, cursor: "pointer" }} onClick={() => toggleSort("expires_at")}>
                Expiracao
              </th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Stripe</th>
              <th style={thStyle}>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: "center", color: "#5f6368" }}>
                  Carregando...
                </td>
              </tr>
            ) : null}
            {!loading && (data.items || []).length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: "center", color: "#5f6368" }}>
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : null}
            {(data.items || []).map((item) => (
              <tr key={item.id}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 600, color: "#1a1a1a" }}>{item.full_name || "Sem nome"}</div>
                  <div style={{ color: "#5f6368", fontSize: "0.85rem" }}>{item.email}</div>
                </td>
                <td style={tdStyle}>{formatDateTime(item.last_login_at)}</td>
                <td style={tdStyle}>
                  {item.progress_pct.toFixed(1)}% ({item.completed_lessons}/{item.total_lessons})
                </td>
                <td style={tdStyle}>{formatDateTime(item.expires_at)}</td>
                <td style={tdStyle}>
                  <span
                    style={{
                      padding: "0.25rem 0.55rem",
                      borderRadius: "999px",
                      fontSize: "0.76rem",
                      border: "1px solid rgba(0,0,0,0.12)",
                      background: "#f8f9fa",
                    }}
                  >
                    {item.effective_access_status}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div style={{ fontSize: "0.8rem", color: "#5f6368" }}>{item.stripe_customer_id || "-"}</div>
                  <div style={{ fontSize: "0.8rem", color: "#5f6368" }}>{item.stripe_payment_intent_id || "-"}</div>
                </td>
                <td style={tdStyle}>
                  <Link
                    to={`/admin/users/${item.id}`}
                    style={{
                      border: "1px solid rgba(0,0,0,0.12)",
                      borderRadius: "999px",
                      padding: "0.35rem 0.7rem",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "#1a1a1a",
                      textDecoration: "none",
                    }}
                  >
                    Ver detalhes
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: "0.9rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.8rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ color: "#5f6368", fontSize: "0.9rem" }}>
          Pagina {data.page || 1} de {data.total_pages || 1}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px", padding: "0.45rem 0.55rem", fontFamily: "inherit" }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <button
            type="button"
            disabled={(data.page || 1) <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            style={pagerBtnStyle((data.page || 1) <= 1)}
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={(data.page || 1) >= (data.total_pages || 1)}
            onClick={() => setPage((prev) => prev + 1)}
            style={pagerBtnStyle((data.page || 1) >= (data.total_pages || 1))}
          >
            Proxima
          </button>
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  fontSize: "0.78rem",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "#5f6368",
  fontWeight: 600,
  padding: "0.75rem 0.9rem",
  borderBottom: "1px solid rgba(0,0,0,0.08)",
};

const tdStyle = {
  padding: "0.75rem 0.9rem",
  borderBottom: "1px solid rgba(0,0,0,0.06)",
  fontSize: "0.9rem",
  color: "#1a1a1a",
  verticalAlign: "top",
};

function pagerBtnStyle(disabled) {
  return {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: "999px",
    padding: "0.45rem 0.8rem",
    background: "#ffffff",
    color: disabled ? "#9aa0a6" : "#1a1a1a",
    fontSize: "0.82rem",
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: disabled ? "not-allowed" : "pointer",
  };
}
