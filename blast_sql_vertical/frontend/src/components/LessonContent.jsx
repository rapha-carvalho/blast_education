import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fixPtBrText } from "../utils/ptBrText";

// Dimensions for placeholder boxes
const PLACEHOLDER_SIZES = {
  IMAGEM: { label: "IMAGEM", height: "280px" },
  INFOGRAFICO: { label: "INFOGRÁFICO", height: "340px" },
  IMAGE: { label: "IMAGE", height: "280px" },
  VIDEO: { label: "VIDEO", height: "340px" },
};

// Supported extensions tried in order
const EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "svg"];

/**
 * Builds the canonical image path for a placeholder:
 *   /lessons/{lessonId}/{tabId}/{index}.{ext}
 * Returns all candidate URLs to try in sequence.
 */
function candidatePaths(lessonId, tabId, index) {
  if (!lessonId || !tabId) return [];
  return EXTENSIONS.map(
    (ext) => `/lessons/${lessonId}/${tabId}/${index}.${ext}`
  );
}

/**
 * Component that tries each candidate path until one loads.
 * Falls back to a placeholder box if all fail.
 */
function SmartImage({ candidates, description, height }) {
  const [tryIdx, setTryIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  if (!failed && tryIdx < candidates.length) {
    return (
      <figure style={{ margin: "1.5rem 0", padding: 0, textAlign: "center" }}>
        <img
          key={candidates[tryIdx]}
          src={candidates[tryIdx]}
          alt={description}
          onError={() => {
            if (tryIdx + 1 < candidates.length) {
              setTryIdx((i) => i + 1);
            } else {
              setFailed(true);
            }
          }}
          style={{
            maxWidth: "100%",
            maxHeight: "480px",
            width: "auto",
            height: "auto",
            objectFit: "contain",
            borderRadius: "12px",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            display: "inline-block",
          }}
        />
      </figure>
    );
  }

  // Fallback placeholder box
  return <PlaceholderBox description={description} height={height} expectedPath={candidates[0]} />;
}

function PlaceholderBox({ description, height, expectedPath }) {
  return (
    <div style={{
      width: "100%",
      minHeight: height ?? "280px",
      background: "repeating-linear-gradient(45deg, #f8f9fa, #f8f9fa 10px, #f1f3f4 10px, #f1f3f4 20px)",
      border: "2px dashed #c6cad0",
      borderRadius: "12px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.75rem",
      padding: "1.5rem",
      margin: "1.5rem 0",
      textAlign: "center",
      boxSizing: "border-box",
    }}>
      <div style={{
        background: "#e8eaed",
        color: "#5f6368",
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        padding: "0.3rem 0.8rem",
        borderRadius: "50px",
      }}>
        📷 Imagem pendente
      </div>
      {expectedPath && (
        <p style={{ margin: 0, fontSize: "0.75rem", color: "#9aa0a6", fontFamily: "monospace" }}>
          Aguardando: <strong>{expectedPath}</strong>
        </p>
      )}
    </div>
  );
}

// Splits markdown body into text and placeholder segments
function parseSegments(body) {
  const regex = /\[PLACEHOLDER_(IMAGEM|INFOGRAFICO|IMAGE|VIDEO|INFOGR[AÁ]FICO): ([^\]]+)\]/gi;
  const segments = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(body)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "markdown", content: body.slice(lastIndex, match.index) });
    }
    segments.push({ type: "placeholder", placeholderType: match[1].toUpperCase(), description: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < body.length) {
    segments.push({ type: "markdown", content: body.slice(lastIndex) });
  }
  return segments;
}

const mdComponents = {
  table: ({ children }) => (
    <div style={{ overflowX: "auto", margin: "1rem 0" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.95rem" }}>{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th style={{ border: "1px solid rgba(0,0,0,0.1)", padding: "0.65rem 1rem", textAlign: "left", background: "#f8f9fa", color: "#1a1a1a", fontWeight: 600, fontSize: "0.97rem" }}>
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td style={{ border: "1px solid rgba(0,0,0,0.1)", padding: "0.65rem 1rem", color: "#5f6368", fontSize: "0.97rem" }}>{children}</td>
  ),
  pre: ({ children }) => (
    <pre style={{ background: "#1e1e2e", color: "#cdd6f4", padding: "1.25rem", borderRadius: "10px", overflow: "auto", fontSize: "0.9rem", lineHeight: 1.6, margin: "1rem 0" }}>
      {children}
    </pre>
  ),
  code: ({ children, className }) =>
    className ? (
      <code className={className} style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>{children}</code>
    ) : (
      <code style={{ background: "#f1f3f4", color: "#ea4335", padding: "0.2em 0.45em", borderRadius: "4px", fontSize: "0.9em", fontFamily: "'JetBrains Mono', monospace" }}>
        {children}
      </code>
    ),
  blockquote: ({ children }) => (
    <blockquote style={{ borderLeft: "4px solid #1a73e8", margin: "1.5rem 0", padding: "1rem 1.4rem", background: "#f0f6ff", borderRadius: "0 10px 10px 0", color: "#1a1a1a", fontSize: "1.05rem" }}>
      {children}
    </blockquote>
  ),
  h3: ({ children }) => <h3 style={{ marginTop: "2.2rem", marginBottom: "0.6rem", color: "#1a1a1a", fontSize: "1.55rem", fontWeight: 700 }}>{children}</h3>,
  h4: ({ children }) => <h4 style={{ marginTop: "1.8rem", marginBottom: "0.5rem", color: "#1a1a1a", fontSize: "1.3rem", fontWeight: 700 }}>{children}</h4>,
  p: ({ children }) => <p style={{ margin: "0.9rem 0", lineHeight: 1.8, color: "#3c3c3c", fontSize: "1.1rem" }}>{children}</p>,
  li: ({ children }) => <li style={{ marginBottom: "0.5rem", lineHeight: 1.75, fontSize: "1.07rem" }}>{children}</li>,
  hr: () => <hr style={{ border: "none", borderTop: "1px solid rgba(0,0,0,0.08)", margin: "2rem 0" }} />,
};

/**
 * LessonContent
 *
 * Props:
 *   markdown / contentMarkdown — the raw markdown string
 *   lessonId  — e.g. "lesson_m1_1"  (used to resolve image paths)
 *   tabId     — e.g. "tab_intro"    (used to resolve image paths)
 *
 * Image resolution:
 *   /lessons/{lessonId}/{tabId}/1.png  (1-indexed, by order of appearance)
 *   Falls back through .png → .jpg → .jpeg → .webp → .gif → .svg
 *   If none found: shows a placeholder box with the expected path.
 */
export default function LessonContent({ markdown, contentMarkdown, lessonId, tabId }) {
  const raw = markdown ?? contentMarkdown;
  if (!raw) return null;
  const body = fixPtBrText(raw);

  const segments = parseSegments(body);
  let imgCounter = 0;

  return (
    <div className="lesson-content">
      {segments.map((seg, i) => {
        if (seg.type === "placeholder") {
          imgCounter += 1;
          const size = PLACEHOLDER_SIZES[seg.placeholderType] ?? PLACEHOLDER_SIZES.IMAGEM;
          const paths = candidatePaths(lessonId, tabId, imgCounter);
          return paths.length > 0 ? (
            <SmartImage
              key={i}
              candidates={paths}
              description={seg.description}
              height={size.height}
            />
          ) : (
            <PlaceholderBox
              key={i}
              description={seg.description}
              height={size.height}
              expectedPath={null}
            />
          );
        }
        return (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={mdComponents}>
            {seg.content}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}
