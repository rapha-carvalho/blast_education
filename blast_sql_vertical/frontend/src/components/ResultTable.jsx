export default function ResultTable({ columns, rows, error }) {
  if (error) {
    return (
      <div
        style={{
          padding: "1rem",
          background: "#3d1f1f",
          border: "1px solid #f85149",
          borderRadius: "6px",
          color: "#f85149",
        }}
      >
        {error}
      </div>
    );
  }
  if (!columns || !rows) return null;
  return (
    <div
      style={{
        overflow: "auto",
        border: "1px solid #30363d",
        borderRadius: "6px",
        background: "#0d1117",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#161b22" }}>
            {columns.map((col) => (
              <th
                key={col}
                style={{
                  padding: "0.5rem 0.75rem",
                  textAlign: "left",
                  borderBottom: "1px solid #30363d",
                  fontWeight: 600,
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderBottom: "1px solid #21262d",
                  }}
                >
                  {cell != null ? String(cell) : "NULL"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
