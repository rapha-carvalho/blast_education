import React, { useMemo, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import ReactECharts from "echarts-for-react";
import { Maximize2, X } from "lucide-react";
import { fixPtBrText } from "../utils/ptBrText";

// ─── Palette ───────────────────────────────────────────────────────────────
const PALETTES = {
  blue:  ["#3B82F6", "#1D4ED8", "#60A5FA", "#93C5FD", "#BFDBFE"],
  green: ["#10B981", "#059669", "#34D399", "#6EE7B7", "#A7F3D0"],
  red:   ["#EF4444", "#DC2626", "#F87171", "#FCA5A5", "#FECACA"],
  multi: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"],
};

const DEFAULT_PALETTE = PALETTES.multi;

function palette(color_scheme) {
  return PALETTES[color_scheme] || PALETTES.blue;
}

// ─── Number formatter ───────────────────────────────────────────────────────
function fmt(val) {
  const n = Number(val);
  if (isNaN(n)) return String(val ?? "");
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

// ─── Parse tabular data → arrays ECharts expects ───────────────────────────
function parseRows(columns, rows, { x, y, type }) {
  const xIdx = x ? columns.indexOf(x) : -1;
  const yIdxs = (y || []).map((col) => columns.indexOf(col));

  if (type === "funnel") {
    const LABELS = {
      sessoes_visita:   "Visita",
      sessoes_cart:     "Carrinho",
      sessoes_checkout: "Checkout",
      sessoes_compra:   "Compra",
    };
    return (y || []).map((col, i) => {
      const idx = yIdxs[i];
      const val = idx >= 0 && rows[0] ? Number(rows[0][idx]) || 0 : 0;
      return { name: LABELS[col] || col, value: val };
    });
  }

  return rows.map((row) => {
    const obj = { name: xIdx >= 0 ? String(row[xIdx] ?? "") : "" };
    (y || []).forEach((col, i) => {
      const idx = yIdxs[i];
      obj[col] = idx >= 0 ? parseFloat(row[idx]) || 0 : 0;
    });
    return obj;
  });
}

// ─── Build ECharts option ───────────────────────────────────────────────────
function buildOption(cfg, columns, rows) {
  const { type, title, y, color_scheme } = cfg;
  const colors  = palette(color_scheme);
  const primary = colors[0];
  const data    = parseRows(columns, rows, cfg);
  const names   = data.map((d) => d.name);
  const yKeys   = y || [];

  const baseTextStyle = { fontFamily: "Inter, sans-serif", color: "#374151" };
  const axisLine  = { lineStyle: { color: "#e5e7eb" } };
  const splitLine = { lineStyle: { color: "#f3f4f6" } };
  const axisLabel = { color: "#6b7280", fontSize: 11 };

  if (type === "bar") {
    return {
      animation: false, color: colors, textStyle: baseTextStyle,
      grid: { top: 36, right: 16, bottom: 56, left: 56, containLabel: true },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: (params) =>
        `<b>${params[0].name}</b><br/>${params.map((p) =>
          `${p.marker}${p.seriesName}: <b>${fmt(p.value)}</b>`).join("<br/>")}` },
      xAxis: { type: "category", data: names, axisLabel: { ...axisLabel, rotate: names.length > 8 ? 25 : 0 }, axisLine },
      yAxis: { type: "value", axisLabel: { ...axisLabel, formatter: fmt }, splitLine },
      series: yKeys.map((col, i) => ({
        name: col, type: "bar", data: data.map((d) => d[col]),
        barMaxWidth: 48,
        itemStyle: { borderRadius: [4, 4, 0, 0], color: colors[i % colors.length] },
        ...(color_scheme === "red" ? { itemStyle: { color: primary, borderRadius: [4, 4, 0, 0] } } : {}),
        label: { show: true, position: "top", fontSize: 10, color: "#6b7280", formatter: (p) => fmt(p.value) },
      })),
    };
  }

  if (type === "bar_horizontal") {
    return {
      animation: false, color: colors, textStyle: baseTextStyle,
      grid: { top: 24, right: 64, bottom: 16, left: 16, containLabel: true },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: (params) =>
        `<b>${params[0].name}</b><br/>${params.map((p) =>
          `${p.marker}${p.seriesName}: <b>${fmt(p.value)}</b>`).join("<br/>")}` },
      xAxis: { type: "value", axisLabel: { ...axisLabel, formatter: fmt }, splitLine },
      yAxis: { type: "category", data: names, axisLabel: { ...axisLabel, width: 90, overflow: "truncate" }, axisLine },
      series: yKeys.map((col, i) => ({
        name: col, type: "bar", data: data.map((d) => d[col]),
        barMaxWidth: 32,
        itemStyle: { borderRadius: [0, 4, 4, 0], color: colors[i % colors.length] },
        label: { show: true, position: "right", fontSize: 10, color: "#6b7280", formatter: (p) => fmt(p.value) },
      })),
    };
  }

  if (type === "bar_signed") {
    const col = yKeys[0] || "value";
    return {
      animation: false, textStyle: baseTextStyle,
      grid: { top: 36, right: 16, bottom: 56, left: 56, containLabel: true },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: (params) =>
        `<b>${params[0].name}</b><br/>${params.map((p) =>
          `${p.marker}${p.seriesName}: <b>${fmt(p.value)}%</b>`).join("<br/>")}` },
      xAxis: { type: "category", data: names, axisLabel: { ...axisLabel, rotate: names.length > 8 ? 25 : 0 }, axisLine },
      yAxis: { type: "value", axisLabel: { ...axisLabel, formatter: (v) => `${v}%` }, splitLine },
      series: [{
        name: col, type: "bar", data: data.map((d) => ({
          value: d[col],
          itemStyle: { color: d[col] >= 0 ? "#10B981" : "#EF4444", borderRadius: d[col] >= 0 ? [4,4,0,0] : [0,0,4,4] },
        })),
        barMaxWidth: 48,
        label: { show: true, position: "top", fontSize: 10, color: "#6b7280", formatter: (p) => `${fmt(p.value)}%` },
      }],
    };
  }

  if (type === "line") {
    return {
      animation: false, color: colors, textStyle: baseTextStyle,
      grid: { top: 36, right: 24, bottom: 56, left: 56, containLabel: true },
      tooltip: { trigger: "axis", formatter: (params) =>
        `<b>${params[0].name}</b><br/>${params.map((p) =>
          `${p.marker}${p.seriesName}: <b>${fmt(p.value)}</b>`).join("<br/>")}` },
      xAxis: { type: "category", data: names, axisLabel: { ...axisLabel, rotate: names.length > 8 ? 25 : 0 }, axisLine },
      yAxis: { type: "value", axisLabel: { ...axisLabel, formatter: fmt }, splitLine },
      legend: yKeys.length > 1 ? { bottom: 4, textStyle: { fontSize: 11, color: "#6b7280" } } : { show: false },
      series: yKeys.map((col, i) => ({
        name: col, type: "line", smooth: true, data: data.map((d) => d[col]),
        symbol: "circle", symbolSize: 5,
        lineStyle: { color: colors[i % colors.length], width: 2 },
        itemStyle: { color: colors[i % colors.length] },
      })),
    };
  }

  if (type === "area") {
    return {
      animation: false, color: colors, textStyle: baseTextStyle,
      grid: { top: 36, right: 24, bottom: 56, left: 56, containLabel: true },
      tooltip: { trigger: "axis", formatter: (params) =>
        `<b>${params[0].name}</b><br/>${params.map((p) =>
          `${p.marker}${p.seriesName}: <b>${fmt(p.value)}</b>`).join("<br/>")}` },
      xAxis: { type: "category", data: names, axisLabel: { ...axisLabel, rotate: names.length > 8 ? 25 : 0 }, axisLine },
      yAxis: { type: "value", axisLabel: { ...axisLabel, formatter: fmt }, splitLine },
      legend: yKeys.length > 1 ? { bottom: 4, textStyle: { fontSize: 11, color: "#6b7280" } } : { show: false },
      series: yKeys.map((col, i) => ({
        name: col, type: "line", smooth: true, data: data.map((d) => d[col]),
        symbol: "circle", symbolSize: 4,
        lineStyle: { color: colors[i % colors.length], width: 2 },
        itemStyle: { color: colors[i % colors.length] },
        areaStyle: { color: colors[i % colors.length], opacity: 0.12 },
      })),
    };
  }

  if (type === "pie" || type === "donut") {
    const col = yKeys[0] || "value";
    const pieData = data.map((d, i) => ({
      name: d.name, value: d[col],
      itemStyle: { color: DEFAULT_PALETTE[i % DEFAULT_PALETTE.length] },
    }));
    return {
      animation: false, textStyle: baseTextStyle,
      tooltip: { trigger: "item", formatter: (p) => `${p.marker}${p.name}: <b>${fmt(p.value)}</b> (${p.percent}%)` },
      legend: { orient: "horizontal", bottom: 4, textStyle: { fontSize: 11, color: "#6b7280" } },
      series: [{
        type: "pie", radius: ["40%", "68%"], center: ["50%", "46%"],
        data: pieData, label: { show: false }, labelLine: { show: false },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: "rgba(0,0,0,0.12)" } },
      }],
    };
  }

  if (type === "funnel") {
    const funnelColors = ["#3B82F6", "#6366F1", "#8B5CF6", "#A855F7"];
    return {
      animation: false, textStyle: baseTextStyle,
      tooltip: { trigger: "item", formatter: (p) => `${p.name}: <b>${fmt(p.value)}</b>` },
      series: [{
        type: "funnel", left: "8%", width: "84%", top: 16, bottom: 16,
        sort: "descending", gap: 3,
        data: data.map((d, i) => ({
          name: d.name, value: d.value,
          itemStyle: { color: funnelColors[i % funnelColors.length] },
        })),
        label: { position: "inside", color: "#fff", fontWeight: 600, fontSize: 12,
          formatter: (p) => `${p.name}  ${fmt(p.value)}` },
        labelLine: { show: false },
      }],
    };
  }

  return null;
}

// ─── Single chart card ───────────────────────────────────────────────────────
function ChartCard({ cfg, columns, rows, chartHeight }) {
  const option = useMemo(() => buildOption(cfg, columns, rows), [cfg, columns, rows]);
  if (!option) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      {cfg.title && (
        <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#374151", letterSpacing: "0.01em" }}>
          {fixPtBrText(cfg.title)}
        </p>
      )}
      <ReactECharts option={option} style={{ height: chartHeight, width: "100%" }} opts={{ renderer: "canvas" }} notMerge />
    </div>
  );
}

// ─── Modal overlay (via portal) ─────────────────────────────────────────────
function ChartModal({ configs, columns, rows, onClose }) {
  const chartHeight = configs.length > 1 ? 360 : 480;

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      {/* Panel — stop propagation so clicks inside don't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
          width: "min(920px, 92vw)",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: "1px solid #f0f0f0",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
            {fixPtBrText(configs[0]?.title || "Gráfico")}
            {configs.length > 1 && ` (+${configs.length - 1})`}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 6, color: "#6b7280", display: "flex", alignItems: "center",
              borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "20px 24px 16px", flex: 1 }}>
          {configs.map((cfg, i) => (
            <ChartCard key={i} cfg={cfg} columns={columns} rows={rows} chartHeight={chartHeight} />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Public component ────────────────────────────────────────────────────────
export default function ChartResult({ chartConfig, columns, rows, chartRef }) {
  const [modalOpen, setModalOpen] = useState(false);

  const configs = useMemo(
    () => (Array.isArray(chartConfig) ? chartConfig : [chartConfig]),
    [chartConfig]
  );

  if (!columns || !rows || rows.length === 0) return null;

  const inlineHeight = configs.length > 1 ? 220 : 280;

  return (
    <>
      {/* Inline card (always fixed height) */}
      <div
        ref={chartRef}
        style={{
          marginTop: 16,
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          padding: "14px 16px 10px",
          position: "relative",
        }}
      >
        {/* Expand button → opens modal */}
        <button
          onClick={() => setModalOpen(true)}
          title="Expandir gráfico"
          style={{
            position: "absolute", top: 10, right: 10,
            background: "none", border: "none", cursor: "pointer",
            padding: 4, color: "#9ca3af", display: "flex", alignItems: "center",
          }}
        >
          <Maximize2 size={15} />
        </button>

        {configs.map((cfg, i) => (
          <ChartCard key={i} cfg={cfg} columns={columns} rows={rows} chartHeight={inlineHeight} />
        ))}
      </div>

      {/* Portal modal */}
      {modalOpen && (
        <ChartModal
          configs={configs}
          columns={columns}
          rows={rows}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
