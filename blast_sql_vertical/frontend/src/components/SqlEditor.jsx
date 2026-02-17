import { Editor } from "@monaco-editor/react";

export default function SqlEditor({ value, onChange, height = 180 }) {
  return (
    <Editor
      height={height}
      defaultLanguage="sql"
      value={value}
      onChange={onChange}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: "on",
        folding: false,
        scrollBeyondLastLine: false,
      }}
    />
  );
}
