"use client";

import Editor from "@monaco-editor/react";
import type { ReactNode } from "react";
import { ChevronDownIcon } from "@/components/Icons";
import { jetbrains } from "@/lib/fonts";
import { defineEditorTheme, EDITOR_THEME } from "@/lib/monaco-theme";

const EDITOR_OPTIONS = {
  fontFamily: jetbrains.style.fontFamily,
  fontSize: 14,
  lineHeight: 24,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  padding: { top: 16, bottom: 16 },
  glyphMargin: false,
  folding: false,
  lineNumbersMinChars: 3,
  lineDecorationsWidth: 8,
  renderLineHighlight: "none",
  overviewRulerLanes: 0,
  colorDecorators: false,
  bracketPairColorization: { enabled: false },
  guides: { indentation: false, bracketPairs: false },
  scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
} as const;

type Props = {
  label: string;
  filename: string;
  /** Control shown on the right of the pane header (format / theme select). */
  action: ReactNode;
  language: string;
  value: string;
  collapsed: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
};

export default function EditorPane({
  label,
  filename,
  action,
  language,
  value,
  collapsed,
  onToggle,
  onChange,
}: Props) {
  return (
    <div
      className={`flex min-h-0 w-full flex-col overflow-clip rounded-[12px] bg-ed ${
        collapsed ? "shrink-0" : "flex-1"
      }`}
    >
      <div
        className={`flex h-[40px] shrink-0 items-center justify-between bg-ed2 px-[12px] font-mono text-[12px] font-medium ${
          collapsed ? "" : "border-b border-edline"
        }`}
      >
        <div className="flex items-center gap-[8px]">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={!collapsed}
            aria-label={`${collapsed ? "Expand" : "Collapse"} ${label} pane`}
            className="flex size-[20px] cursor-pointer items-center justify-center rounded-[4px] text-eddim transition-colors hover:bg-edline hover:text-edtext focus-visible:outline-2 focus-visible:outline-accent-light"
          >
            <ChevronDownIcon className={`size-[16px] transition-transform ${collapsed ? "-rotate-90" : ""}`} />
          </button>
          <span className="tracking-[0.72px] text-eddim">{label}</span>
          <span className="rounded-[6px] bg-edline px-[8px] py-[5px] text-edtext">{filename}</span>
        </div>
        {action}
      </div>
      {!collapsed && (
        <div className="min-h-0 flex-1">
          <Editor
            theme={EDITOR_THEME}
            language={language}
            value={value}
            beforeMount={defineEditorTheme}
            onMount={(_, monaco) => {
              // Re-measure once the web font has loaded so the cursor aligns with glyphs.
              document.fonts.ready.then(() => monaco.editor.remeasureFonts());
            }}
            onChange={(v) => onChange(v ?? "")}
            options={EDITOR_OPTIONS}
          />
        </div>
      )}
    </div>
  );
}
