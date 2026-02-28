import { ArrowLeft, Printer } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import BraceParticles from "../components/BraceParticles";

export default function CheatsheetPage() {
  const { courseSlug } = useParams();
  const backTo = courseSlug ? `/cursos/${courseSlug}` : "/";
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#1e293b", fontFamily: "'Outfit', 'Inter', sans-serif" }}>

      {/* ── HEADER NAVIGATION ── */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, padding: "1.5rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to={backTo} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#fff", textDecoration: "none", fontSize: "0.95rem", fontWeight: 500, opacity: 0.8, transition: "opacity 0.2s" }} onMouseOver={e => e.currentTarget.style.opacity = 1} onMouseOut={e => e.currentTarget.style.opacity = 0.8}>
          <ArrowLeft size={16} /> Voltar
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => window.print()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              padding: "0.4rem 0.8rem",
              borderRadius: 6,
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s"
            }}
            onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
            onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
          >
            <Printer size={16} /> Imprimir / PDF
          </button>
          <div style={{ fontSize: "0.85rem", letterSpacing: "1px", textTransform: "uppercase", color: "#4285F4", fontWeight: 700 }}>
            Blast Report
          </div>
        </div>
      </div>

      {/* ── HERO COVER ── */}
      <div className="no-print" style={{ background: "linear-gradient(to bottom, #111 0%, #0a0a0a 100%)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <BraceParticles>
          <div style={{ padding: "4rem 2rem", pointerEvents: "auto" }}>
            <div style={{ display: "inline-block", background: "rgba(66, 133, 244, 0.1)", border: "1px solid rgba(66, 133, 244, 0.2)", color: "#4285F4", padding: "0.4rem 1rem", borderRadius: 999, fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "1.5rem" }}>
              Material de Apoio
            </div>
            <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontWeight: 700, color: "#fff", margin: "0 0 1rem 0", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              SQL Cheatsheet
            </h1>
            <p style={{ fontSize: "1.1rem", color: "#9aa0a6", maxWidth: 600, margin: "0 auto 2rem auto", lineHeight: 1.6 }}>
              Referência rápida com todos os comandos estruturados ensinados ao longo do curso.
            </p>
          </div>
        </BraceParticles>
      </div>

      <style>{`
        @media print {
          body {
            background: #fff;
          }
          .no-print {
            display: none !important;
          }
          .page {
            width: 297mm;
            height: 210mm;
            padding: 10mm 12mm 6mm 12mm;
            overflow: hidden !important;
          }
        }
        
        .page {
          max-width: 1120px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          padding: 3rem 2rem;
          background: #ffffff;
          position: relative;
        }

        .page::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60%;
          padding-bottom: 60%; /* Creates a square aspect ratio */
          max-width: 550px;
          max-height: 550px;
          background-image: url('/logo/Blast_Icon_Black.png');
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          opacity: 0.04;
          pointer-events: none;
          z-index: 0;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #1a1a1a;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }

        .header-left {
          display: flex;
          align-items: baseline;
          gap: 16px;
        }

        .header-title {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: #1a1a1a;
        }

        .header-subtitle {
          font-size: 13px;
          font-weight: 400;
          color: #64748b;
          letter-spacing: 0.02em;
        }

        .header-brand {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #9aa0a6;
        }

        .header-brand span {
          color: #1a73e8;
        }

        /* ── GRID ── */
        .cheatsheet-grid {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: repeat(3, 1fr);
          gap: 12px;
          min-height: 0;
          position: relative;
          z-index: 1;
        }

        /* ── CARD ── */
        .cheatsheet-card {
          background: #f8f9fa;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(0,0,0,0.06);
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .cheatsheet-card.span-2 {
          grid-row: span 2;
        }

        .card-header {
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #ffffff;
          flex-shrink: 0;
        }

        .bg-blue   { background: #1a73e8; }
        .bg-dark   { background: #1a1a1a; }
        .bg-teal   { background: #0d9488; }
        .bg-purple { background: #7c3aed; }
        .bg-orange { background: #d97706; }
        .bg-rose   { background: #e11d48; }
        .bg-indigo { background: #4f46e5; }
        .bg-emerald{ background: #059669; }
        .bg-slate  { background: #475569; }

        .card-body {
          padding: 10px 12px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .cmd-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          line-height: 1.4;
        }

        .kw {
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 11px;
          font-weight: 700;
          color: #1a73e8;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .desc {
          font-size: 10px;
          color: #5f6368;
          line-height: 1.35;
        }

        .syntax {
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 10px;
          color: #5f6368;
          background: #eef1f5;
          padding: 4px 8px;
          border-radius: 4px;
          line-height: 1.4;
          margin-top: 2px;
        }

        .sep {
          border: none;
          border-top: 1px solid rgba(0,0,0,0.08);
          margin: 4px 0;
        }

        /* ── FOOTER ── */
        .footer {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 12px;
          margin-top: 16px;
          border-top: 1px solid rgba(0,0,0,0.08);
          position: relative;
          z-index: 1;
        }

        .footer-left {
          font-size: 10px;
          color: #9aa0a6;
        }

        .footer-right {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #9aa0a6;
        }

        .footer-right span {
          color: #1a1a1a;
          font-weight: 700;
        }

        @media (max-width: 1024px) {
           .cheatsheet-grid { grid-template-columns: repeat(2, 1fr); grid-template-rows: auto; }
           .cheatsheet-card.span-2 { grid-row: auto; }
        }
        @media (max-width: 600px) {
           .cheatsheet-grid { grid-template-columns: 1fr; }
           .page { padding: 1.5rem 1rem; }
        }
      `}</style>

      {/* ── CHEATSHEET NATIVE A4 CONTAINER ── */}
      <div className="page">
        {/* HEADER */}
        <div className="header">
          <div className="header-left">
            <div className="header-title">SQL Cheatsheet</div>
            <div className="header-subtitle">Referência rápida · Todos os comandos essenciais</div>
          </div>
          <div className="header-brand">
            <img src="/Blast_Full_Black.png" alt="Blast Education" style={{ height: "64px", display: "block" }} />
          </div>
        </div>

        {/* GRID */}
        <div className="cheatsheet-grid">
          {/* 1. Seleção Básica */}
          <div className="cheatsheet-card">
            <div className="card-header bg-blue">Seleção Básica</div>
            <div className="card-body">
              <div className="cmd-row"><span className="kw">SELECT</span><span className="desc">colunas da tabela</span></div>
              <div className="cmd-row"><span className="kw">SELECT *</span><span className="desc">todas as colunas</span></div>
              <div className="cmd-row"><span className="kw">FROM</span><span className="desc">tabela de origem</span></div>
              <div className="cmd-row"><span className="kw">DISTINCT</span><span className="desc">valores únicos</span></div>
              <div className="cmd-row"><span className="kw">AS</span><span className="desc">alias para coluna/tabela</span></div>
              <div className="cmd-row"><span className="kw">ORDER BY</span><span className="desc">ordena ASC ou DESC</span></div>
              <div className="cmd-row"><span className="kw">LIMIT</span><span className="desc">limita nº de linhas</span></div>
              <div className="cmd-row"><span className="kw">OFFSET</span><span className="desc">pula linhas iniciais</span></div>
              <div className="syntax">SELECT col1, col2 FROM tabela ORDER BY col1 DESC LIMIT 10</div>
            </div>
          </div>

          {/* 2. Operadores & Filtros */}
          <div className="cheatsheet-card">
            <div className="card-header bg-dark">Operadores & Filtros</div>
            <div className="card-body">
              <div className="cmd-row"><span className="kw">WHERE</span><span className="desc">filtra linhas</span></div>
              <div className="cmd-row"><span className="kw">= != &lt; &gt; &lt;= &gt;=</span><span className="desc">comparação</span></div>
              <div className="cmd-row"><span className="kw">AND / OR / NOT</span><span className="desc">lógica booleana</span></div>
              <div className="cmd-row"><span className="kw">BETWEEN a AND b</span><span className="desc">intervalo inclusivo</span></div>
              <div className="cmd-row"><span className="kw">IN (v1, v2)</span><span className="desc">lista de valores</span></div>
              <div className="cmd-row"><span className="kw">LIKE '%txt%'</span><span className="desc">padrão de texto</span></div>
              <div className="cmd-row"><span className="kw">IS NULL</span><span className="desc">valor nulo</span></div>
              <div className="cmd-row"><span className="kw">IS NOT NULL</span><span className="desc">valor nulo</span></div>
              <div className="syntax">WHERE status != 'cancelado' AND valor BETWEEN 100 AND 500</div>
            </div>
          </div>

          {/* 3. Agregação */}
          <div className="cheatsheet-card">
            <div className="card-header bg-teal">Agregação</div>
            <div className="card-body">
              <div className="cmd-row"><span className="kw">COUNT(*)</span><span className="desc">total de linhas</span></div>
              <div className="cmd-row"><span className="kw">COUNT(DISTINCT col)</span><span className="desc">valores únicos</span></div>
              <div className="cmd-row"><span className="kw">SUM(col)</span><span className="desc">soma</span></div>
              <div className="cmd-row"><span className="kw">AVG(col)</span><span className="desc">média</span></div>
              <div className="cmd-row"><span className="kw">MIN(col) / MAX(col)</span><span className="desc">mín / máx</span></div>
              <div className="cmd-row"><span className="kw">GROUP BY</span><span className="desc">agrupa por categoria</span></div>
              <div className="cmd-row"><span className="kw">HAVING</span><span className="desc">filtra após agregação</span></div>
              <div className="cmd-row"><span className="kw">ROUND(val, n)</span><span className="desc">arredonda decimais</span></div>
              <div className="syntax">SELECT canal, COUNT(*), SUM(valor) FROM pedidos GROUP BY canal HAVING COUNT(*) &gt; 10</div>
            </div>
          </div>

          {/* 4. JOINs */}
          <div className="cheatsheet-card">
            <div className="card-header bg-purple">JOINs</div>
            <div className="card-body">
              <div className="cmd-row"><span className="kw">INNER JOIN</span><span className="desc">apenas matches</span></div>
              <div className="cmd-row"><span className="kw">LEFT JOIN</span><span className="desc">tudo da esquerda + matches</span></div>
              <div className="cmd-row"><span className="kw">CROSS JOIN</span><span className="desc">produto cartesiano</span></div>
              <div className="cmd-row"><span className="kw">ON</span><span className="desc">condição de junção</span></div>
              <hr className="sep" />
              <div className="syntax">SELECT p.nome, c.cidade FROM pedidos p INNER JOIN clientes c ON p.cliente_id = c.id</div>
              <hr className="sep" />
              <div className="cmd-row"><span className="kw">Dica:</span><span className="desc">Use aliases curtos (p, c) para legibilidade. Filtre com WHERE antes do JOIN.</span></div>
            </div>
          </div>

          {/* 5. Funções de Data */}
          <div className="cheatsheet-card">
            <div className="card-header bg-orange">Funções de Data</div>
            <div className="card-body">
              <div className="cmd-row"><span className="kw">EXTRACT(part FROM col)</span></div>
              <div className="cmd-row"><span className="desc">Extrai year, month, day, hour, dow</span></div>
              <div className="cmd-row"><span className="kw">DATE_TRUNC('p', col)</span></div>
              <div className="cmd-row"><span className="desc">Trunca para month, year, quarter, week</span></div>
              <div className="cmd-row"><span className="kw">DATEDIFF('unit', d1, d2)</span></div>
              <div className="cmd-row"><span className="desc">Diferença em day, month, year</span></div>
              <hr className="sep" />
              <div className="syntax">SELECT DATE_TRUNC('month', dt) AS mes, COUNT(*) FROM pedidos GROUP BY 1 ORDER BY 1</div>
            </div>
          </div>

          {/* 6. Lógica Condicional */}
          <div className="cheatsheet-card">
            <div className="card-header bg-rose">Lógica Condicional</div>
            <div className="card-body">
              <div className="cmd-row"><span className="kw">CASE WHEN...THEN</span></div>
              <div className="cmd-row"><span className="desc">Condicional com caminhos múltiplos</span></div>
              <div className="cmd-row"><span className="kw">ELSE...END</span><span className="desc">valor padrão</span></div>
              <div className="cmd-row"><span className="kw">COALESCE(a, b)</span><span className="desc">primeiro não nulo</span></div>
              <div className="cmd-row"><span className="kw">NULLIF(a, b)</span><span className="desc">NULL se a = b</span></div>
              <hr className="sep" />
              <div className="syntax">CASE WHEN valor &gt; 1000 THEN 'alto' WHEN valor &gt; 100 THEN 'medio' ELSE 'baixo' END</div>
              <hr className="sep" />
              <div className="cmd-row"><span className="kw">Dica:</span><span className="desc">Use CASE dentro de SUM() ou COUNT() para agregações condicionais.</span></div>
            </div>
          </div>

          {/* 7. Subqueries & CTEs */}
          <div className="cheatsheet-card">
            <div className="card-header bg-indigo">Subqueries & CTEs</div>
            <div className="card-body">
              <div className="cmd-row"><span className="kw">WITH nome AS (...)</span></div>
              <div className="cmd-row"><span className="desc">CTE — consulta temporária nomeada</span></div>
              <div className="cmd-row"><span className="kw">Subquery no WHERE</span></div>
              <div className="cmd-row"><span className="desc">WHERE col IN (SELECT ...)</span></div>
              <div className="cmd-row"><span className="kw">Subquery no FROM</span></div>
              <div className="cmd-row"><span className="desc">FROM (SELECT ...) AS sub</span></div>
              <div className="cmd-row"><span className="kw">Múltiplos CTEs</span></div>
              <div className="cmd-row"><span className="desc">WITH a AS (...), b AS (...)</span></div>
              <div className="syntax">WITH vendas AS (SELECT canal, SUM(v) AS total FROM pedidos GROUP BY canal) SELECT * FROM vendas WHERE total &gt; 10000</div>
            </div>
          </div>

          {/* 8. Window Functions (span 2 rows) */}
          <div className="cheatsheet-card span-2">
            <div className="card-header bg-emerald">Window Functions</div>
            <div className="card-body">
              <div className="cmd-row"><span className="kw">ROW_NUMBER()</span><span className="desc">número sequencial único</span></div>
              <div className="cmd-row"><span className="kw">RANK()</span><span className="desc">ranking com empates (pula)</span></div>
              <div className="cmd-row"><span className="kw">DENSE_RANK()</span><span className="desc">ranking com empates (sem pular)</span></div>
              <div className="cmd-row"><span className="kw">LAG(col, n)</span><span className="desc">valor da linha anterior</span></div>
              <div className="cmd-row"><span className="kw">LEAD(col, n)</span><span className="desc">valor da próxima linha</span></div>
              <hr className="sep" />
              <div className="cmd-row"><span className="kw">SUM() OVER()</span><span className="desc">soma acumulada</span></div>
              <div className="cmd-row"><span className="kw">AVG() OVER()</span><span className="desc">média móvel</span></div>
              <hr className="sep" />
              <div className="cmd-row"><span className="kw">PARTITION BY</span><span className="desc">janela por grupo</span></div>
              <div className="cmd-row"><span className="kw">ORDER BY</span><span className="desc">ordena dentro da janela</span></div>
              <div className="cmd-row"><span className="kw">ROWS BETWEEN</span><span className="desc">define frame da janela</span></div>
              <hr className="sep" />
              <div className="syntax">ROW_NUMBER() OVER (PARTITION BY canal ORDER BY valor DESC)</div>
              <div className="syntax" style={{ marginTop: "8px" }}>SUM(valor) OVER (ORDER BY data ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)</div>
            </div>
          </div>

          {/* 9. Outros & Dicas */}
          <div className="cheatsheet-card">
            <div className="card-header bg-slate">Outros & Boas Práticas</div>
            <div className="card-body">
              <div className="cmd-row"><span className="kw">UNION ALL</span><span className="desc">combina resultados</span></div>
              <div className="cmd-row"><span className="kw">ABS(val)</span><span className="desc">valor absoluto</span></div>
              <div className="cmd-row"><span className="kw">CAST(col AS tipo)</span><span className="desc">converte tipo</span></div>
              <hr className="sep" />
              <div className="cmd-row" style={{ marginTop: "4px" }}><span className="desc" style={{ fontSize: "11px", color: "#1a1a1a", fontWeight: "700" }}>Boas Práticas:</span></div>
              <div className="cmd-row"><span className="desc">• Selecione só colunas necessárias</span></div>
              <div className="cmd-row"><span className="desc">• Filtre cedo com WHERE</span></div>
              <div className="cmd-row"><span className="desc">• Use aliases descritivos</span></div>
              <div className="cmd-row"><span className="desc">• CTEs para organizar queries longas</span></div>
              <div className="cmd-row"><span className="desc">• Evite SELECT * em produção</span></div>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="footer">
          <div className="footer-left">SQL do Básico ao Avançado · Todos os comandos essenciais em uma página</div>
          <div className="footer-right">
            <img src="/Blast_Full_Black.png" alt="Blast Education" style={{ height: "56px", display: "block", opacity: 0.6 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
