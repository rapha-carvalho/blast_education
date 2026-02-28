export default function ResultTable({ columns, rows, error }) {
  if (error) {
    return (
      <div
        style={{
          padding: "1rem",
          background: "#fce8e6",
          border: "1px solid #ea4335",
          borderRadius: "6px",
          color: "#c5221f",
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
        border: "1px solid rgba(0,0,0,0.1)",
        borderRadius: "6px",
        background: "#ffffff",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f8f9fa" }}>
            {columns.map((col) => (
              <th
                key={col}
                style={{
                  padding: "0.5rem 0.75rem",
                  textAlign: "left",
                  borderBottom: "1px solid rgba(0,0,0,0.1)",
                  fontWeight: 600,
                  color: "#1a1a1a",
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
                    borderBottom: "1px solid rgba(0,0,0,0.05)",
                    color: "#5f6368"
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
