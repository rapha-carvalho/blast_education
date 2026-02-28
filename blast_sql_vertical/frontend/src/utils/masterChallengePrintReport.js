import { fixPtBrText } from "./ptBrText";

const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const MAIN_SQL_CARD_LIMIT = 3;
const APPENDIX_SQL_CARD_LIMIT = 5;
const MAIN_INSIGHT_LIMIT = 4;

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function n(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function compactNumber(value) {
  const num = n(value);
  if (Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}M`;
  }
  if (Math.abs(num) >= 1_000) {
    return `${(num / 1_000).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}K`;
  }
  return num.toLocaleString("pt-BR");
}

function normalizeStudentName(studentName) {
  if (!studentName) return "Aluno";
  if (studentName.includes("@")) {
    return studentName
      .split("@")[0]
      .split(".")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
      .slice(0, 36);
  }
  return studentName.slice(0, 36);
}

function normalizeTitle(rawTitle, fallback = "") {
  const cleaned = fixPtBrText(String(rawTitle || fallback || ""))
    .replace(/^\s*\d+\s*[.)-]?\s*/i, "")
    .replace(/^\s*(desafio|challenge)\s+\d+\s*[-\u2013\u2014]\s*/i, "")
    .trim();
  return cleaned || fallback || "Sem titulo";
}

function prettyChannel(raw) {
  return String(raw || "")
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function monthLabel(raw) {
  const txt = String(raw || "");
  if (!/^\d{4}-\d{2}$/.test(txt)) return txt;
  const [year, month] = txt.split("-");
  return `${month}/${year.slice(2)}`;
}

function detectTechniques(sql) {
  const src = String(sql || "").toUpperCase();
  const tags = [];
  if (/\bSELECT\b/.test(src)) tags.push("SELECT");
  if (/\bWHERE\b/.test(src)) tags.push("WHERE");
  if (/\bGROUP\s+BY\b/.test(src)) tags.push("GROUP BY");
  if (/\bORDER\s+BY\b/.test(src)) tags.push("ORDER BY");
  if (/\bJOIN\b/.test(src)) tags.push("JOIN");
  if (/\bWITH\b/.test(src)) tags.push("CTE");
  if (/\bOVER\s*\(/.test(src)) tags.push("Window");
  if (/\bCASE\b/.test(src)) tags.push("CASE");
  if (/\b(SUM|AVG|COUNT|MIN|MAX)\b/.test(src)) tags.push("Agrega&ccedil;&atilde;o");
  return [...new Set(tags)].slice(0, 4);
}

function highlightSql(rawSql) {
  const keywords = [
    "SELECT",
    "DISTINCT",
    "FROM",
    "WHERE",
    "GROUP BY",
    "ORDER BY",
    "HAVING",
    "JOIN",
    "LEFT JOIN",
    "RIGHT JOIN",
    "INNER JOIN",
    "FULL JOIN",
    "ON",
    "UNION ALL",
    "UNION",
    "WITH",
    "CASE",
    "WHEN",
    "THEN",
    "ELSE",
    "END",
    "OVER",
    "PARTITION BY",
    "LIMIT",
    "OFFSET",
    "AND",
    "OR",
    "IN",
    "BETWEEN",
    "IS NULL",
    "IS NOT NULL",
  ].sort((a, b) => b.length - a.length);

  const escaped = esc(rawSql).replace(/\r\n/g, "\n");
  const parts = [];
  let i = 0;

  while (i < escaped.length) {
    if (escaped[i] === "'") {
      let j = i + 1;
      while (j < escaped.length && escaped[j] !== "'") j += 1;
      parts.push(`<span class="sql-str">${escaped.slice(i, j + 1)}</span>`);
      i = j + 1;
      continue;
    }

    if (escaped.slice(i, i + 2) === "--") {
      let j = escaped.indexOf("\n", i);
      if (j < 0) j = escaped.length;
      parts.push(`<span class="sql-comment">${escaped.slice(i, j)}</span>`);
      i = j;
      continue;
    }

    let matched = false;
    for (const kw of keywords) {
      const pattern = new RegExp(
        `^${kw.replace(/ /g, "\\s+")}(?=[\\s\\n\\r(,;]|$)`,
        "i"
      );
      const result = escaped.slice(i).match(pattern);
      if (!result) continue;
      parts.push(`<span class="sql-key">${result[0]}</span>`);
      i += result[0].length;
      matched = true;
      break;
    }
    if (matched) continue;

    const numMatch = escaped.slice(i).match(/^(\d+(\.\d+)?)(?=[\s\n\r),;]|$)/);
    if (numMatch) {
      parts.push(`<span class="sql-num">${numMatch[0]}</span>`);
      i += numMatch[0].length;
      continue;
    }

    parts.push(escaped[i]);
    i += 1;
  }

  return parts.join("");
}

function topBar(sectionLabel) {
  return `<div class="topbar">
    <div class="brand-mark"><span class="brand-dot"></span>blast</div>
    <div class="topbar-section">${sectionLabel}</div>
  </div>`;
}

function sectionHeader(kicker, title, subtitle = "") {
  return `<div class="section-head">
    <div class="section-kicker">${kicker}</div>
    <h2 class="section-title">${title}</h2>
    ${subtitle ? `<p class="section-subtitle">${subtitle}</p>` : ""}
  </div>`;
}

function buildBarChart(rows, title, idPrefix) {
  const data = (rows || [])
    .map((row) => ({
      label: prettyChannel(row?.[0]),
      value: n(row?.[1]),
    }))
    .filter((item) => item.label && item.value > 0)
    .slice(0, 5);

  if (!data.length) {
    return `<div class="chart-empty">Sem dados suficientes para este gr&aacute;fico.</div>`;
  }

  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const width = 342;
  const height = 190;
  const left = 86;
  const right = 24;
  const top = 30;
  const barHeight = 18;
  const gap = 14;
  const trackWidth = width - left - right;
  const gradId = `${idPrefix}-bar`;

  const bars = data
    .map((item, idx) => {
      const y = top + idx * (barHeight + gap);
      const barWidth = Math.max(6, (item.value / maxValue) * trackWidth);
      return `<text x="${left - 8}" y="${(y + 12).toFixed(
        1
      )}" class="svg-axis-label" text-anchor="end">${esc(item.label)}</text>
      <rect x="${left}" y="${y.toFixed(1)}" width="${barWidth.toFixed(
        1
      )}" height="${barHeight}" rx="6" fill="url(#${gradId})"></rect>
      <text x="${(left + barWidth + 6).toFixed(1)}" y="${(y + 12).toFixed(
        1
      )}" class="svg-value-label">${compactNumber(item.value)}</text>`;
    })
    .join("\n");

  return `<svg viewBox="0 0 ${width} ${height}" class="chart-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#0B57D0"></stop>
        <stop offset="100%" stop-color="#00A3FF"></stop>
      </linearGradient>
    </defs>
    <text x="0" y="14" class="svg-title">${esc(title)}</text>
    ${bars}
  </svg>`;
}

function buildLineChart(rows, title, idPrefix) {
  const data = (rows || [])
    .map((row) => ({
      label: monthLabel(row?.[0]),
      value: n(row?.[1]),
    }))
    .filter((item) => item.label)
    .reverse();

  if (!data.length) {
    return `<div class="chart-empty">Sem dados suficientes para este gr&aacute;fico.</div>`;
  }

  const width = 342;
  const height = 190;
  const left = 24;
  const right = 18;
  const top = 26;
  const bottom = 28;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const gradId = `${idPrefix}-area`;
  const points = data.map((item, idx) => {
    const x =
      left +
      (data.length === 1 ? chartWidth / 2 : (idx / (data.length - 1)) * chartWidth);
    const y = top + chartHeight - (item.value / maxValue) * chartHeight;
    return { ...item, x, y };
  });

  const linePath = points
    .map((point, idx) => `${idx === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
  const baseline = top + chartHeight;
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(
    1
  )} ${baseline.toFixed(1)} L${points[0].x.toFixed(1)} ${baseline.toFixed(1)} Z`;

  const gridLines = [0, 0.5, 1]
    .map((ratio) => {
      const y = top + chartHeight - ratio * chartHeight;
      const label = (maxValue * ratio).toLocaleString("pt-BR", {
        minimumFractionDigits: ratio === 0 ? 0 : 1,
        maximumFractionDigits: 1,
      });
      return `<line x1="${left}" y1="${y.toFixed(1)}" x2="${(left + chartWidth).toFixed(
        1
      )}" y2="${y.toFixed(1)}" class="svg-grid"></line>
      <text x="${(left - 4).toFixed(1)}" y="${(y + 3).toFixed(
        1
      )}" class="svg-axis-label" text-anchor="end">${esc(label)}%</text>`;
    })
    .join("\n");

  const xLabels = points
    .map(
      (point) =>
        `<text x="${point.x.toFixed(1)}" y="${(baseline + 14).toFixed(
          1
        )}" class="svg-axis-label" text-anchor="middle">${esc(point.label)}</text>`
    )
    .join("\n");

  const pointsSvg = points
    .map(
      (point) =>
        `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(
          1
        )}" r="3.2" fill="#FFFFFF" stroke="#DC2626" stroke-width="2"></circle>`
    )
    .join("\n");

  return `<svg viewBox="0 0 ${width} ${height}" class="chart-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#DC2626" stop-opacity="0.30"></stop>
        <stop offset="100%" stop-color="#DC2626" stop-opacity="0.03"></stop>
      </linearGradient>
    </defs>
    <text x="0" y="14" class="svg-title">${esc(title)}</text>
    ${gridLines}
    <path d="${areaPath}" fill="url(#${gradId})"></path>
    <path d="${linePath}" fill="none" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round"></path>
    ${pointsSvg}
    ${xLabels}
  </svg>`;
}
function buildFindings({
  kpis,
  completedCount,
  interpCount,
  totalChallenges,
  totalInterpretations,
}) {
  const delivered = n(kpis?.[0]?.rawVal);
  const revenue = n(kpis?.[1]?.rawVal);
  const cancel = n(kpis?.[2]?.rawVal);
  const funnel = n(kpis?.[3]?.rawVal);
  const findings = [];

  if (delivered > 0) {
    findings.push(
      `${delivered.toLocaleString(
        "pt-BR"
      )} pedidos entregues no per&iacute;odo analisado.`
    );
  }

  if (revenue > 0) {
    findings.push(
      `Receita l&iacute;quida consolidada de R$ ${revenue.toLocaleString("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}.`
    );
  }

  if (cancel > 0) {
    findings.push(
      cancel > 9
        ? `Taxa de cancelamento em ${cancel.toLocaleString(
            "pt-BR",
            { maximumFractionDigits: 1 }
          )}% (acima do limite recomendado).`
        : `Taxa de cancelamento em ${cancel.toLocaleString(
            "pt-BR",
            { maximumFractionDigits: 1 }
          )}% (dentro da faixa esperada).`
    );
  }

  if (funnel > 0) {
    findings.push(
      `Convers&atilde;o visita-compra em ${funnel.toLocaleString("pt-BR", {
        maximumFractionDigits: 1,
      })}%.`
    );
  }

  findings.push(
    `Progresso do aluno: ${completedCount}/${totalChallenges} desafios e ${interpCount}/${totalInterpretations} an&aacute;lises escritas.`
  );

  return findings.slice(0, 5);
}

function buildRecommendations(kpis) {
  const cancel = n(kpis?.[2]?.rawVal);
  const funnel = n(kpis?.[3]?.rawVal);
  const recommendations = [];

  if (cancel > 9) {
    recommendations.push(
      "Priorizar revis&atilde;o da jornada no app para reduzir cancelamentos em checkout e p&oacute;s-pagamento."
    );
  } else {
    recommendations.push(
      "Manter monitoramento de cancelamento com alerta semanal por canal para preservar a faixa atual."
    );
  }

  if (funnel < 30) {
    recommendations.push(
      "Executar experimento de otimiza&ccedil;&atilde;o no funil carrinho &rarr; checkout para elevar convers&atilde;o."
    );
  } else {
    recommendations.push(
      "Escalar os padr&otilde;es de convers&atilde;o dos canais mais eficientes para o restante da opera&ccedil;&atilde;o."
    );
  }

  recommendations.push(
    "Padronizar trilha de qualidade de dados com valida&ccedil;&otilde;es autom&aacute;ticas antes de an&aacute;lises executivas."
  );

  return recommendations;
}

function collectInsights(writtenAnswersByTab, lesson) {
  const tabs = (lesson?.tabs || []).filter((tab) => tab.type === "interpretation");
  return tabs
    .map((tab, idx) => {
      const answer = fixPtBrText((writtenAnswersByTab?.[tab.id] || "").trim());
      if (!answer) return null;
      return {
        index: idx + 1,
        title: normalizeTitle(tab.title, `Análise ${idx + 1}`),
        preview: answer.slice(0, 420),
        hasMore: answer.length > 420,
      };
    })
    .filter(Boolean);
}

function buildSqlCards(snippets, resultSnapshotByChallenge, start, limit, compact = false) {
  return (snippets || [])
    .slice(start, start + limit)
    .map((snippet, idx) => {
      const title = normalizeTitle(snippet.title, `Desafio ${start + idx + 1}`);
      const sql = fixPtBrText(String(snippet.sql || "").trim());
      const sqlPreview = sql.split(/\r?\n/).slice(0, compact ? 8 : 12).join("\n");
      const tags = detectTechniques(sql);
      const tagsHtml = tags
        .map((tag) => `<span class="chip chip-outline">${tag}</span>`)
        .join("");
      const chartImg =
        resultSnapshotByChallenge?.[snippet.exerciseIndex]?.chartImageBase64 || "";
      const rowCount = n(resultSnapshotByChallenge?.[snippet.exerciseIndex]?.rowCount);

      return `<article class="sql-card ${compact ? "sql-card-compact" : ""}">
        <div class="sql-head">
          <div>
            <div class="sql-overline">SQL executado</div>
            <h4 class="sql-title">${esc(title)}</h4>
          </div>
          <div class="chip-row">${tagsHtml}</div>
        </div>
        <pre class="sql-block">${highlightSql(sqlPreview)}</pre>
        ${chartImg ? `<img src="${chartImg}" class="sql-chart" alt="Visualização da consulta"/>` : ""}
        ${rowCount > 0 ? `<div class="sql-meta">${rowCount.toLocaleString("pt-BR")} linhas retornadas</div>` : ""}
      </article>`;
    })
    .join("\n");
}

function buildCoverPage({
  studentName,
  dateLabel,
  certId,
  completedCount,
  interpCount,
  totalChallenges,
  totalInterpretations,
}) {
  return `<section class="page page-cover">
    <div class="cover-inner">
      <div class="cover-brand-row">
        <div class="brand-mark"><span class="brand-dot"></span>blast</div>
        <div class="cover-date">${esc(dateLabel)}</div>
      </div>
      <div class="cover-hero">
        <div class="cover-brace">{</div>
        <div class="cover-content">
          <div class="cover-kicker">Master Challenge &middot; SQL</div>
          <h1 class="cover-title">Relat&oacute;rio Executivo de Dados</h1>
          <p class="cover-subtitle">
            Documento anal&iacute;tico com foco em receita, cancelamento, funil e qualidade operacional.
          </p>
        </div>
        <div class="cover-brace">}</div>
      </div>
      <div class="cover-meta-list">
        <div class="cover-meta-row">
          <span class="meta-label">Aluno</span>
          <span class="meta-value">${esc(studentName)}</span>
        </div>
        <div class="cover-meta-row">
          <span class="meta-label">Progresso</span>
          <span class="meta-value">${completedCount}/${totalChallenges} SQL &middot; ${interpCount}/${totalInterpretations} insights</span>
        </div>
        <div class="cover-meta-row">
          <span class="meta-label">Certificado</span>
          <span class="meta-value mono">${esc(certId)}</span>
        </div>
      </div>
    </div>
  </section>`;
}

function buildContextPage({
  completedCount,
  interpCount,
  lesson,
  tabsByExercise,
}) {
  const totalChallenges =
    Object.keys(tabsByExercise || {}).length ||
    (lesson?.tabs || []).filter((tab) => tab.type === "challenge").length ||
    1;
  const totalInterpretations =
    (lesson?.tabs || []).filter((tab) => tab.type === "interpretation").length || 1;
  const challengePct = Math.round((completedCount / Math.max(totalChallenges, 1)) * 100);
  const interpPct = Math.round((interpCount / Math.max(totalInterpretations, 1)) * 100);

  const scopeItems = [
    "Diagn&oacute;stico de receita bruta, l&iacute;quida e ticket m&eacute;dio.",
    "An&aacute;lise de cancelamentos, reembolsos e qualidade operacional.",
    "Leitura de funil visita &rarr; compra e comportamento de churn.",
    "Identifica&ccedil;&atilde;o de anomalias no schema capstone.",
  ];
  const skills = [
    "SELECT",
    "WHERE",
    "GROUP BY",
    "JOIN",
    "CTE",
    "Fun&ccedil;&otilde;es de Janela",
    "Subqueries",
    "CASE",
  ];

  return `<section class="page">
    ${topBar("Contexto do Caso")}
    <div class="page-inner">
      ${sectionHeader(
        "Panorama",
        "Problema de Neg&oacute;cio",
        "Hip&oacute;teses concorrentes, escopo anal&iacute;tico e status de execu&ccedil;&atilde;o."
      )}
      <div class="grid-two context-grid">
        <div class="stack">
          <p class="lead-copy">
            A <strong>Blast Commerce</strong> opera nos canais web, app e inside sales. O
            crescimento acelerou no H1/2024 e desacelerou no H2, acionando uma reuni&atilde;o de
            emerg&ecirc;ncia com diagn&oacute;sticos distintos entre CMO, CFO e COO.
          </p>
          <div class="context-rows">
            <div class="context-row">
              <span class="context-role">CMO Mariana</span>
              <span>Canais pagos est&atilde;o reduzindo LTV m&eacute;dio e qualidade de aquisi&ccedil;&atilde;o.</span>
            </div>
            <div class="context-row">
              <span class="context-role">CFO Roberto</span>
              <span>Eletr&ocirc;nicos perde margem por reembolsos e defeitos recorrentes.</span>
            </div>
            <div class="context-row">
              <span class="context-role">COO Felipe</span>
              <span>Canal app concentra cancelamento elevado e impacto operacional.</span>
            </div>
          </div>
        </div>
        <div class="stack">
          <article class="card flat-card">
            <div class="card-title">Progresso do Aluno</div>
            <div class="progress-item">
              <div class="progress-label">Desafios SQL</div>
              <div class="progress-value">${completedCount}/${totalChallenges}</div>
              <div class="progress-bar"><span style="width:${Math.min(100, challengePct)}%"></span></div>
            </div>
            <div class="progress-item">
              <div class="progress-label">An&aacute;lises Escritas</div>
              <div class="progress-value">${interpCount}/${totalInterpretations}</div>
              <div class="progress-bar"><span style="width:${Math.min(100, interpPct)}%"></span></div>
            </div>
          </article>
          <article class="card flat-card">
            <div class="card-title">Escopo Anal&iacute;tico</div>
            <ul class="simple-list">
              ${scopeItems.map((item) => `<li>${item}</li>`).join("")}
            </ul>
          </article>
          <article class="card flat-card">
            <div class="card-title">Skills SQL Demonstradas</div>
            <div class="chip-row">
              ${skills.map((skill) => `<span class="chip">${skill}</span>`).join("")}
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>`;
}
function buildMetricsPage({
  kpis,
  channelRows,
  cancelRows,
  completedCount,
  interpCount,
  lesson,
  tabsByExercise,
}) {
  const totalChallenges =
    Object.keys(tabsByExercise || {}).length ||
    (lesson?.tabs || []).filter((tab) => tab.type === "challenge").length ||
    1;
  const totalInterpretations =
    (lesson?.tabs || []).filter((tab) => tab.type === "interpretation").length || 1;
  const normalizedKpis = (kpis || []).slice(0, 4);
  const findings = buildFindings({
    kpis: normalizedKpis,
    completedCount,
    interpCount,
    totalChallenges,
    totalInterpretations,
  });

  const kpiCards = normalizedKpis
    .map((kpi) => {
      const label = fixPtBrText(kpi?.label || "M&eacute;trica");
      const tone = /cancel/i.test(label)
        ? n(kpi?.rawVal) > 9
          ? "danger"
          : "warn"
        : /receita/i.test(label)
          ? "good"
          : /convers/i.test(label)
            ? "brand-alt"
            : "brand";

      return `<article class="kpi-card" data-tone="${tone}">
        <div class="kpi-label">${esc(label)}</div>
        <div class="kpi-value">${esc(kpi?.value || "-")}</div>
        <div class="kpi-sub">${esc(fixPtBrText(kpi?.sub || ""))}</div>
      </article>`;
    })
    .join("\n");

  return `<section class="page">
    ${topBar("Achados e M&eacute;tricas")}
    <div class="page-inner">
      ${sectionHeader(
        "Resultados",
        "M&eacute;tricas-Chave",
        "Leitura objetiva de performance por canal e tend&ecirc;ncia de cancelamento."
      )}
      <div class="kpi-grid">
        ${kpiCards}
      </div>
      <div class="chart-grid">
        <article class="card chart-card">
          ${buildBarChart(channelRows, "Pedidos por Canal", "orders-channel")}
        </article>
        <article class="card chart-card">
          ${buildLineChart(cancelRows, "Cancelamento Mensal (%)", "cancel-monthly")}
        </article>
      </div>
      <article class="card">
        <div class="card-title">S&iacute;ntese Executiva</div>
        <div class="findings-grid">
          ${findings
            .map(
              (finding, idx) => `<div class="finding-item">
                <div class="finding-index">${String(idx + 1).padStart(2, "0")}</div>
                <p>${finding}</p>
              </div>`
            )
            .join("")}
        </div>
      </article>
    </div>
  </section>`;
}

function buildEvidencePage({
  snippets,
  resultSnapshotByChallenge,
  writtenAnswersByTab,
  lesson,
  kpis,
}) {
  const sqlCards = buildSqlCards(
    snippets,
    resultSnapshotByChallenge,
    0,
    MAIN_SQL_CARD_LIMIT
  );
  const insights = collectInsights(writtenAnswersByTab, lesson).slice(0, MAIN_INSIGHT_LIMIT);
  const recommendations = buildRecommendations(kpis);

  if (!sqlCards && !insights.length) return "";

  const insightCards = insights
    .map(
      (item) => `<article class="insight-card">
        <div class="insight-head">
          <div class="insight-index">${String(item.index).padStart(2, "0")}</div>
          <h4>${esc(item.title)}</h4>
        </div>
        <p>${esc(item.preview)}${item.hasMore ? "&hellip;" : ""}</p>
      </article>`
    )
    .join("");

  return `<section class="page">
    ${topBar("Evid&ecirc;ncias e Recomenda&ccedil;&otilde;es")}
    <div class="page-inner">
      ${sectionHeader(
        "An&aacute;lise",
        "Evid&ecirc;ncias SQL",
        "Consultas executadas e interpreta&ccedil;&otilde;es escritas pelo aluno."
      )}
      <div class="grid-two evidence-grid">
        <div class="stack">
          ${sqlCards || `<article class="card empty-card">Nenhuma consulta validada para exibir nesta se&ccedil;&atilde;o.</article>`}
        </div>
        <div class="stack">
          <article class="card">
            <div class="card-title">Insights Escritos</div>
            ${insightCards || `<p class="muted">Nenhuma an&aacute;lise escrita registrada.</p>`}
          </article>
          <article class="card">
            <div class="card-title">Pr&oacute;ximos Passos Recomendados</div>
            <ol class="ordered-list">
              ${recommendations.map((item) => `<li>${item}</li>`).join("")}
            </ol>
          </article>
        </div>
      </div>
    </div>
  </section>`;
}

function buildAppendixPage({ snippets, resultSnapshotByChallenge }) {
  const appendixCards = buildSqlCards(
    snippets,
    resultSnapshotByChallenge,
    MAIN_SQL_CARD_LIMIT,
    APPENDIX_SQL_CARD_LIMIT,
    true
  );

  if (!appendixCards) return "";

  return `<section class="page">
    ${topBar("Ap&ecirc;ndice T&eacute;cnico")}
    <div class="page-inner">
      ${sectionHeader(
        "Ap&ecirc;ndice",
        "Consultas Adicionais",
        "Trechos complementares relevantes para auditoria t&eacute;cnica."
      )}
      <div class="mini-grid">
        ${appendixCards}
      </div>
    </div>
  </section>`;
}

export function buildReportHTML({
  studentName,
  dateLabel,
  certId,
  kpis,
  channelRows,
  cancelRows,
  snippets,
  writtenAnswersByTab,
  lesson,
  completedCount,
  interpCount,
  resultSnapshotByChallenge,
  tabsByExercise,
}) {
  const safeName = normalizeStudentName(studentName);
  const totalChallenges =
    Object.keys(tabsByExercise || {}).length ||
    (lesson?.tabs || []).filter((tab) => tab.type === "challenge").length ||
    1;
  const totalInterpretations =
    (lesson?.tabs || []).filter((tab) => tab.type === "interpretation").length || 1;

  const pages = [
    buildCoverPage({
      studentName: safeName,
      dateLabel,
      certId,
      completedCount,
      interpCount,
      totalChallenges,
      totalInterpretations,
    }),
    buildContextPage({
      completedCount,
      interpCount,
      lesson,
      tabsByExercise,
    }),
    buildMetricsPage({
      kpis,
      channelRows,
      cancelRows,
      completedCount,
      interpCount,
      lesson,
      tabsByExercise,
    }),
  ];

  const evidencePage = buildEvidencePage({
    snippets,
    resultSnapshotByChallenge,
    writtenAnswersByTab,
    lesson,
    kpis,
  });
  if (evidencePage) pages.push(evidencePage);

  const appendixPage = buildAppendixPage({
    snippets,
    resultSnapshotByChallenge,
  });
  if (appendixPage) pages.push(appendixPage);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Blast - Master Challenge - ${esc(safeName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    :root {
      --canvas: #f1f5fb;
      --surface: #ffffff;
      --ink: #0f172a;
      --muted: #64748b;
      --line: #d8e1ec;
      --brand: #0b57d0;
      --brand-alt: #00a3ff;
      --good: #16a34a;
      --warn: #d97706;
      --danger: #dc2626;
      --topbar: #081223;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    @page {
      size: A4;
      margin: 0;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #d7e0ec;
      font-family: "Manrope", "Segoe UI", sans-serif;
      color: var(--ink);
    }

    .page {
      width: ${PAGE_WIDTH}px;
      height: ${PAGE_HEIGHT}px;
      position: relative;
      overflow: hidden;
      background: var(--canvas);
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
    }

    .page:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .topbar {
      height: 68px;
      background: linear-gradient(120deg, #081223 0%, #0a1730 100%);
      border-bottom: 1px solid rgba(0, 163, 255, 0.28);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
      flex-shrink: 0;
    }

    .topbar-logo {
      height: 24px;
      width: auto;
      opacity: 0.95;
    }

    .topbar-section {
      font-size: 8pt;
      letter-spacing: 1.8px;
      text-transform: uppercase;
      font-weight: 700;
      color: #5aa9ff;
    }

    .page-inner {
      padding: 24px 30px 28px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      flex: 1;
      min-height: 0;
    }

    .section-head {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .section-kicker {
      font-size: 7pt;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #3b82f6;
      font-weight: 700;
    }

    .section-title {
      margin: 0;
      font-size: 19pt;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #0f172a;
      line-height: 1.08;
    }

    .section-subtitle {
      margin: 0;
      font-size: 8.5pt;
      line-height: 1.55;
      color: var(--muted);
    }

    .grid-two {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 12px;
      min-height: 0;
    }

    .evidence-grid {
      grid-template-columns: 1.12fr 0.88fr;
      flex: 1;
      min-height: 0;
    }

    .stack {
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-height: 0;
    }

    .card {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 14px 15px;
      box-shadow: 0 10px 26px rgba(15, 23, 42, 0.05);
    }

    .card p {
      margin: 0;
      font-size: 8.1pt;
      line-height: 1.6;
      color: #1f2937;
    }

    .card-emphasis {
      background: linear-gradient(135deg, #ffffff 0%, #eef4ff 100%);
      border-color: #cfe0ff;
    }

    .card-title {
      font-size: 7pt;
      letter-spacing: 1.7px;
      text-transform: uppercase;
      font-weight: 700;
      color: #3f4d63;
      margin-bottom: 10px;
    }

    .mini-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .hypothesis {
      padding-top: 10px;
      border-left-width: 4px;
      border-left-style: solid;
    }

    .h-green {
      border-left-color: #16a34a;
    }

    .h-blue {
      border-left-color: #0b57d0;
    }

    .h-amber {
      border-left-color: #d97706;
    }

    .hypothesis p {
      font-size: 7.6pt;
      color: #374151;
      line-height: 1.5;
    }

    .hypo-role {
      font-size: 6.4pt;
      letter-spacing: 1.3px;
      text-transform: uppercase;
      color: #475569;
      font-weight: 800;
      margin-bottom: 4px;
    }

    .progress-item {
      margin-bottom: 10px;
    }

    .progress-item:last-child {
      margin-bottom: 0;
    }

    .progress-label {
      font-size: 7.3pt;
      color: #334155;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .progress-value {
      font-size: 7.2pt;
      color: #64748b;
      margin-bottom: 5px;
    }

    .progress-bar {
      height: 8px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
    }

    .progress-bar span {
      display: block;
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, #0b57d0 0%, #00a3ff 100%);
    }

    .simple-list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .simple-list li {
      font-size: 7.7pt;
      line-height: 1.45;
      color: #334155;
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }

    .simple-list li::before {
      content: "";
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: #0b57d0;
      margin-top: 5px;
      flex-shrink: 0;
    }

    .chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      background: #ebf3ff;
      color: #0b57d0;
      border: 1px solid #cfe0ff;
      font-size: 6.8pt;
      font-weight: 700;
      padding: 4px 9px;
      line-height: 1;
    }

    .chip-outline {
      background: #ffffff;
      border-color: #d5e4ff;
      color: #245dc8;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }

    .kpi-card {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid var(--line);
      padding: 13px 14px;
      box-shadow: 0 12px 22px rgba(15, 23, 42, 0.05);
      position: relative;
      overflow: hidden;
    }

    .kpi-card::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 4px;
      background: #0b57d0;
    }

    .kpi-card[data-tone="good"]::before {
      background: #16a34a;
    }

    .kpi-card[data-tone="warn"]::before {
      background: #d97706;
    }

    .kpi-card[data-tone="danger"]::before {
      background: #dc2626;
    }

    .kpi-card[data-tone="brand-alt"]::before {
      background: #7c3aed;
    }

    .kpi-label {
      font-size: 6.3pt;
      letter-spacing: 1.4px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 7px;
    }

    .kpi-value {
      font-size: 20pt;
      line-height: 1;
      color: #0f172a;
      font-weight: 800;
      letter-spacing: -0.04em;
      margin-bottom: 5px;
    }

    .kpi-sub {
      font-size: 6.8pt;
      color: #64748b;
      line-height: 1.35;
    }

    .chart-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .chart-card {
      padding: 12px;
    }

    .chart-svg {
      width: 100%;
      height: 185px;
      display: block;
    }

    .svg-title {
      font-family: "Manrope", "Segoe UI", sans-serif;
      font-size: 8px;
      font-weight: 700;
      fill: #111827;
    }

    .svg-axis-label {
      font-family: "Manrope", "Segoe UI", sans-serif;
      font-size: 6.4px;
      font-weight: 600;
      fill: #64748b;
    }

    .svg-value-label {
      font-family: "Manrope", "Segoe UI", sans-serif;
      font-size: 6.6px;
      font-weight: 800;
      fill: #0f172a;
    }

    .svg-grid {
      stroke: rgba(148, 163, 184, 0.35);
      stroke-dasharray: 3 3;
      stroke-width: 1;
    }

    .chart-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 185px;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      color: #94a3b8;
      font-size: 7.6pt;
      font-weight: 600;
      background: #f8fafc;
    }

    .findings-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .finding-item {
      border: 1px solid #d9e3f0;
      background: #f8fbff;
      border-radius: 12px;
      padding: 9px 10px;
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }

    .finding-index {
      font-size: 14pt;
      line-height: 1;
      font-weight: 800;
      color: #bfdbfe;
      letter-spacing: -0.04em;
      min-width: 24px;
    }

    .finding-item p {
      margin: 0;
      font-size: 7.4pt;
      line-height: 1.55;
      color: #334155;
    }

    .sql-card {
      background: #ffffff;
      border: 1px solid #d8e2ef;
      border-radius: 14px;
      padding: 11px 12px;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 0;
    }

    .sql-card-compact {
      gap: 6px;
      padding: 10px;
    }

    .sql-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }

    .sql-overline {
      font-size: 6.3pt;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 2px;
    }

    .sql-title {
      margin: 0;
      font-size: 8.2pt;
      line-height: 1.35;
      color: #0f172a;
      font-weight: 700;
    }

    .sql-block {
      margin: 0;
      font-family: "JetBrains Mono", "Consolas", monospace;
      font-size: 6.2pt;
      line-height: 1.5;
      color: #0f172a;
      background: #f8fafc;
      border: 1px solid #dbe5f2;
      border-radius: 10px;
      padding: 8px;
      white-space: pre-wrap;
      overflow: hidden;
      max-height: 144px;
    }

    .sql-card-compact .sql-block {
      max-height: 106px;
    }

    .sql-chart {
      width: 100%;
      max-height: 120px;
      object-fit: contain;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #ffffff;
    }

    .sql-meta {
      font-size: 6.6pt;
      color: #64748b;
      font-weight: 600;
    }

    .sql-key {
      color: #0b57d0;
      font-weight: 700;
    }

    .sql-str {
      color: #1f7a3d;
      font-weight: 600;
    }

    .sql-num {
      color: #9333ea;
      font-weight: 600;
    }

    .sql-comment {
      color: #64748b;
      font-style: italic;
    }

    .insight-card {
      border: 1px solid #dce6f4;
      background: #f8fbff;
      border-radius: 12px;
      padding: 10px;
      margin-bottom: 8px;
    }

    .insight-head {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }

    .insight-head h4 {
      margin: 0;
      font-size: 7.6pt;
      color: #0f172a;
      line-height: 1.3;
      font-weight: 700;
    }

    .insight-index {
      width: 20px;
      height: 20px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #e7efff;
      color: #0b57d0;
      font-size: 6.4pt;
      font-weight: 800;
      flex-shrink: 0;
    }

    .insight-card p {
      margin: 0;
      font-size: 7.2pt;
      line-height: 1.55;
      color: #334155;
    }

    .ordered-list {
      margin: 0;
      padding-left: 16px;
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .ordered-list li {
      font-size: 7.5pt;
      line-height: 1.5;
      color: #334155;
    }

    .muted {
      margin: 0;
      color: #64748b;
      font-size: 7.5pt;
      line-height: 1.5;
    }

    .empty-card {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 180px;
      color: #64748b;
      font-size: 7.6pt;
      font-weight: 600;
      background: #f8fafc;
    }

    .mono {
      font-family: "JetBrains Mono", "Consolas", monospace;
    }

    .page-cover {
      background: radial-gradient(circle at 18% 14%, rgba(0, 163, 255, 0.26), transparent 55%),
        radial-gradient(circle at 84% 84%, rgba(11, 87, 208, 0.38), transparent 52%),
        linear-gradient(160deg, #020812 0%, #06132a 58%, #081223 100%);
      color: #ffffff;
    }

    .cover-glow {
      position: absolute;
      border-radius: 999px;
      filter: blur(20px);
      opacity: 0.35;
      pointer-events: none;
    }

    .cover-glow-a {
      width: 280px;
      height: 280px;
      background: #00a3ff;
      top: -100px;
      right: -80px;
    }

    .cover-glow-b {
      width: 340px;
      height: 340px;
      background: #0b57d0;
      left: -120px;
      bottom: -140px;
    }

    .cover-grid-pattern {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
      background-size: 36px 36px;
      opacity: 0.22;
      mask-image: radial-gradient(circle at center, black 35%, transparent 92%);
      pointer-events: none;
    }

    .cover-inner {
      position: relative;
      z-index: 1;
      height: 100%;
      padding: 82px 64px 70px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .cover-logo {
      width: 116px;
      height: auto;
      opacity: 0.96;
      margin-bottom: 26px;
    }

    .cover-kicker {
      font-size: 8pt;
      letter-spacing: 3px;
      text-transform: uppercase;
      font-weight: 700;
      color: #9dd5ff;
      margin-bottom: 14px;
    }

    .cover-title {
      margin: 0;
      font-size: 40pt;
      font-weight: 800;
      line-height: 1.03;
      letter-spacing: -0.04em;
      max-width: 590px;
      margin-bottom: 16px;
    }

    .cover-subtitle {
      margin: 0;
      font-size: 10.2pt;
      line-height: 1.7;
      color: rgba(226, 236, 255, 0.88);
      max-width: 560px;
      margin-bottom: 32px;
    }

    .cover-meta-grid {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      max-width: 620px;
    }

    .cover-meta-card {
      background: rgba(9, 20, 40, 0.72);
      border: 1px solid rgba(132, 187, 255, 0.26);
      border-radius: 14px;
      padding: 12px 14px;
      text-align: left;
      backdrop-filter: blur(3px);
    }

    .meta-label {
      font-size: 6.4pt;
      letter-spacing: 1.6px;
      text-transform: uppercase;
      color: #9fc8ff;
      font-weight: 700;
      margin-bottom: 5px;
    }

    .meta-value {
      font-size: 8pt;
      color: #ffffff;
      font-weight: 600;
      line-height: 1.4;
    }

    /* Platform alignment pass: flatter, cleaner, minimal depth */
    :root {
      --canvas: #f8f9fa;
      --surface: #ffffff;
      --ink: #1a1a1a;
      --muted: #9aa0a6;
      --line: rgba(0, 0, 0, 0.08);
      --brand: #1a73e8;
      --brand-alt: #1a73e8;
      --good: #34a853;
      --warn: #f59e0b;
      --danger: #ea4335;
    }

    html,
    body {
      background: #f8f9fa;
      color: #1a1a1a;
      font-family: "Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .page {
      background: #f8f9fa;
    }

    .topbar {
      height: 64px;
      background: #ffffff;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      padding: 0 26px;
    }

    .brand-mark {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 17px;
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: -0.02em;
      text-transform: lowercase;
    }

    .brand-dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: #1a1a1a;
      display: inline-block;
      flex-shrink: 0;
    }

    .topbar-section {
      color: #1a73e8;
      font-size: 7pt;
      letter-spacing: 1.8px;
      font-weight: 600;
    }

    .page-inner {
      padding: 24px 26px 24px;
      gap: 12px;
    }

    .section-kicker {
      color: #1a73e8;
      font-size: 6.8pt;
      letter-spacing: 1.8px;
      font-weight: 600;
    }

    .section-title {
      font-size: 20pt;
      font-weight: 600;
      line-height: 1.08;
      color: #1a1a1a;
      letter-spacing: -0.035em;
    }

    .section-subtitle {
      color: #7d838c;
      font-size: 8.2pt;
      line-height: 1.5;
      font-weight: 400;
    }

    .context-grid {
      grid-template-columns: 1.15fr 0.85fr;
    }

    .lead-copy {
      margin: 0;
      font-size: 9pt;
      line-height: 1.72;
      color: #2c3440;
      font-weight: 400;
    }

    .context-rows {
      border-top: 1px solid rgba(0, 0, 0, 0.08);
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }

    .context-row {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 10px;
      padding: 10px 0;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
      font-size: 8.2pt;
      color: #2f3742;
      line-height: 1.5;
    }

    .context-row:first-child {
      border-top: none;
    }

    .context-role {
      font-size: 6.4pt;
      letter-spacing: 1.4px;
      text-transform: uppercase;
      color: #5f6368;
      font-weight: 700;
    }

    .card,
    .kpi-card,
    .sql-card,
    .insight-card {
      box-shadow: none;
      border-radius: 10px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      background: #ffffff;
    }

    .card {
      padding: 12px;
    }

    .flat-card {
      background: #ffffff;
    }

    .card-title {
      color: #5f6368;
      font-size: 6.7pt;
      letter-spacing: 1.5px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .progress-label {
      font-size: 7.1pt;
      color: #1a1a1a;
      font-weight: 500;
    }

    .progress-value {
      font-size: 7pt;
      color: #7d838c;
    }

    .progress-bar {
      height: 6px;
      background: #eceff3;
    }

    .progress-bar span {
      background: #1a73e8;
    }

    .simple-list li {
      font-size: 7.7pt;
      line-height: 1.45;
      color: #2f3742;
    }

    .simple-list li::before {
      background: #1a73e8;
    }

    .chip {
      background: transparent;
      border-color: rgba(26, 115, 232, 0.25);
      color: #1a73e8;
      padding: 3px 8px;
      font-weight: 500;
      font-size: 6.6pt;
    }

    .chip-outline {
      background: transparent;
      border-color: rgba(0, 0, 0, 0.1);
      color: #4b5563;
    }

    .kpi-card {
      border-radius: 10px;
      padding: 11px 11px 10px;
    }

    .kpi-card::before {
      height: 2px;
    }

    .kpi-label {
      font-size: 6.1pt;
      color: #7d838c;
      margin-bottom: 6px;
    }

    .kpi-value {
      font-size: 18pt;
      color: #1a1a1a;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .kpi-sub {
      font-size: 6.6pt;
      color: #7d838c;
    }

    .chart-card {
      border-radius: 10px;
      border-color: rgba(0, 0, 0, 0.08);
      padding: 10px;
    }

    .svg-title,
    .svg-axis-label,
    .svg-value-label {
      font-family: "Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .svg-title {
      fill: #1a1a1a;
      font-weight: 600;
    }

    .svg-axis-label {
      fill: #7d838c;
      font-weight: 400;
    }

    .svg-value-label {
      fill: #2f3742;
      font-weight: 600;
    }

    .svg-grid {
      stroke: rgba(0, 0, 0, 0.12);
    }

    .findings-grid {
      grid-template-columns: 1fr;
      gap: 0;
    }

    .finding-item {
      border: none;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 0;
      background: transparent;
      padding: 8px 0;
    }

    .finding-item:first-child {
      border-top: none;
      padding-top: 0;
    }

    .finding-index {
      color: #d4d8df;
      font-size: 12pt;
      font-weight: 700;
      min-width: 20px;
    }

    .finding-item p {
      color: #2f3742;
      font-size: 7.4pt;
      line-height: 1.5;
    }

    .sql-card {
      border-radius: 10px;
      padding: 10px;
      gap: 7px;
    }

    .sql-overline {
      color: #7d838c;
      font-size: 6.1pt;
    }

    .sql-title {
      color: #1a1a1a;
      font-size: 7.8pt;
      font-weight: 600;
    }

    .sql-block {
      background: #fafbfc;
      border-color: rgba(0, 0, 0, 0.08);
      border-radius: 8px;
    }

    .sql-key {
      color: #1a73e8;
    }

    .sql-str {
      color: #0f8c47;
    }

    .sql-num {
      color: #8b5cf6;
    }

    .sql-comment {
      color: #7d838c;
    }

    .insight-card {
      border-radius: 10px;
      padding: 9px;
      margin-bottom: 7px;
      background: #ffffff;
    }

    .insight-index {
      background: #eef3ff;
      color: #1a73e8;
    }

    .insight-head h4 {
      color: #1a1a1a;
      font-weight: 600;
    }

    .insight-card p,
    .ordered-list li,
    .muted {
      color: #4b5563;
    }

    .page-cover {
      background: #f8f9fa;
      color: #1a1a1a;
    }

    .cover-glow,
    .cover-grid-pattern,
    .cover-logo {
      display: none;
    }

    .cover-inner {
      padding: 48px 56px 50px;
      align-items: stretch;
      justify-content: flex-start;
      text-align: left;
      gap: 26px;
    }

    .cover-brand-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      padding-bottom: 10px;
    }

    .cover-date {
      font-size: 7.1pt;
      color: #7d838c;
      font-weight: 500;
    }

    .cover-hero {
      display: grid;
      grid-template-columns: 56px 1fr 56px;
      align-items: center;
      column-gap: 8px;
      margin-top: 10px;
    }

    .cover-brace {
      font-size: 82pt;
      line-height: 0.8;
      color: #1a73e8;
      opacity: 0.75;
      font-weight: 300;
      text-align: center;
    }

    .cover-content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .cover-kicker {
      font-size: 6.9pt;
      letter-spacing: 1.8px;
      text-transform: uppercase;
      color: #1a73e8;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .cover-title {
      margin: 0 0 10px;
      font-size: 42pt;
      font-weight: 600;
      color: #1a1a1a;
      line-height: 1.03;
      letter-spacing: -0.04em;
      max-width: 590px;
    }

    .cover-subtitle {
      margin: 0;
      max-width: 560px;
      color: #6b7280;
      font-size: 9.8pt;
      line-height: 1.6;
    }

    .cover-meta-list {
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }

    .cover-meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      padding: 11px 0;
    }

    .meta-label {
      margin: 0;
      color: #7d838c;
      font-size: 6.6pt;
      letter-spacing: 1.4px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .meta-value {
      color: #1a1a1a;
      font-size: 8pt;
      font-weight: 500;
      text-align: right;
      max-width: 72%;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  ${pages.join("\n\n")}
</body>
</html>`;
}
