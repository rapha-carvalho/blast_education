import { Editor } from "@monaco-editor/react";

export default function SqlEditor({ value, onChange, height = 240 }) {
  return (
    <Editor
      height={height}
      defaultLanguage="sql"
      value={value}
      onChange={onChange}
      theme="light"
      options={{
        minimap: { enabled: false },
        fontSize: 15,
        lineNumbers: "on",
        folding: false,
        scrollBeyondLastLine: false,
      }}
    />
  );
}
