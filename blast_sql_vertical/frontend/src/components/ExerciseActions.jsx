export default function ExerciseActions({ onRun, onValidate, onHint, onSolution }) {
  const btn = (label, onClick, variant = "primary") => (
    <button
      onClick={onClick}
      style={{
        padding: "0.5rem 1rem",
        borderRadius: "6px",
        border: "none",
        fontWeight: 500,
        background: variant === "primary" ? "#238636" : "#21262d",
        color: "#fff",
        marginRight: "0.5rem",
      }}
    >
      {label}
    </button>
  );
  return (
    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
      {btn("Run", onRun)}
      {btn("Check Answer", onValidate)}
      {btn("Hint", onHint, "secondary")}
      {btn("Show Solution", onSolution, "secondary")}
    </div>
  );
}
