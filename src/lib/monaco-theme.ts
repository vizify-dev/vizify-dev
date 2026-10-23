import type { Monaco } from "@monaco-editor/react";

export const EDITOR_THEME = "vizify";

/** Registers the dark editor theme from the Figma mocks (pane #2a3342, dim gutter, pastel syntax). */
export function defineEditorTheme(monaco: Monaco) {
  monaco.editor.defineTheme(EDITOR_THEME, {
    base: "vs-dark",
    inherit: false,
    rules: [
      { token: "", foreground: "e8e9ec" },
      { token: "tag.css", foreground: "c3a6ff" },
      { token: "attribute.name.css", foreground: "7cc4f0" },
      { token: "attribute.value.css", foreground: "e8e9ec" },
      { token: "attribute.value.number.css", foreground: "f4b66e" },
      { token: "attribute.value.unit.css", foreground: "f4b66e" },
      { token: "attribute.value.hex.css", foreground: "8ee0b0" },
      { token: "string.css", foreground: "8ee0b0" },
      { token: "delimiter.css", foreground: "8e94a0" },
      { token: "delimiter.bracket.css", foreground: "8e94a0" },
      { token: "comment.css", foreground: "8e94a0" },
    ],
    colors: {
      "editor.background": "#2a3342",
      "editor.foreground": "#e8e9ec",
      "editorLineNumber.foreground": "#8e94a0",
      "editorLineNumber.activeForeground": "#e8e9ec",
      "editor.lineHighlightBackground": "#00000000",
      "editor.selectionBackground": "#434e63",
      "editorCursor.foreground": "#00d2ff",
      "editorGutter.background": "#2a3342",
      "scrollbarSlider.background": "#434e6380",
    },
  });
}
