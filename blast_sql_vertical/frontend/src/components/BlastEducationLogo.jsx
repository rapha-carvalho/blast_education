/**
 * BlastEducationLogo
 * Unified brand lockup: blast wordmark + "EDUCATION" label.
 *
 * Props:
 *   variant    — "white" (dark bg) | "black" (light bg)     default: "black"
 *   height     — CSS value for logo height (width: auto)     e.g. "clamp(42px, 5vw, 66px)"
 *   width      — CSS value for logo width  (height: auto)    e.g. "170px"
 *                (use height OR width, not both)
 *   style      — extra styles on the wrapper div
 */
export default function BlastEducationLogo({
  variant = "black",
  height,
  width,
  showLabel = true,
  style = {},
}) {
  const isWhite = variant === "white";
  const logoSrc = isWhite ? "/logo/Blast_Full_White.png" : "/Blast_Full_Black.png";
  const labelColor = isWhite ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.35)";

  // Derive font size proportionally from whichever dimension was given.
  // Blast Full wordmark aspect ratio ≈ 4.2 : 1  (wider than tall)
  // So fontSize ≈ height × 0.28  OR  width × 0.067
  const fontSize = width
    ? `calc(${width} * 0.067)`
    : `calc(${height ?? "40px"} * 0.28)`;

  const imgStyle = {
    display: "block",
    filter: isWhite ? "drop-shadow(0 2px 16px rgba(0,0,0,0.5))" : "none",
    ...(width  ? { width,  height: "auto" } : {}),
    ...(height ? { height, width:  "auto" } : {}),
    ...(!width && !height ? { height: "40px", width: "auto" } : {}),
  };

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "0.4em",
        ...style,
      }}
    >
      <img src={logoSrc} alt="Blast Education" style={imgStyle} />
      {showLabel && (
        <span
          style={{
            color: labelColor,
            fontSize,
            fontFamily: "inherit",
            fontWeight: 400,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          Education
        </span>
      )}
    </div>
  );
}
