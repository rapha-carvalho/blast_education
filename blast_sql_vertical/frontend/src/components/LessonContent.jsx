import ReactMarkdown from "react-markdown";

export default function LessonContent({ markdown }) {
  if (!markdown) return null;
  return (
    <div
      className="lesson-content"
      style={{
        padding: "1rem",
        background: "#161b22",
        borderRadius: "6px",
        border: "1px solid #30363d",
        overflowY: "auto",
      }}
    >
      <ReactMarkdown
        components={{
          pre: ({ children }) => (
            <pre
              style={{
                background: "#0d1117",
                padding: "1rem",
                borderRadius: "4px",
                overflow: "auto",
              }}
            >
              {children}
            </pre>
          ),
          code: ({ children, className }) =>
            className ? (
              <code className={className}>{children}</code>
            ) : (
              <code
                style={{
                  background: "#30363d",
                  padding: "0.2em 0.4em",
                  borderRadius: "4px",
                }}
              >
                {children}
              </code>
            ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
