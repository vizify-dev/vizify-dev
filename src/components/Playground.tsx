"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import liveDot from "@/assets/icons/live-dot.svg";
import Button from "@/components/Button";
import EditorPane from "@/components/EditorPane";
import ExportMenu from "@/components/ExportMenu";
import { SaveIcon, UploadIcon } from "@/components/Icons";
import Logo from "@/components/Logo";
import ResizeHandle from "@/components/ResizeHandle";
import Select from "@/components/Select";
import { DEFAULT_CSV } from "@/lib/table/defaults";
import { buildDocument } from "@/lib/table/preview";
import { withTools } from "@/lib/table/tools";
import type { Theme } from "@/lib/table/themes";

const CSV_KEY = "vizify:csv";
const CSS_KEY = "vizify:css";
const SIDEBAR_KEY = "vizify:sidebar";
const CSV_ACCEPT = ".csv,text/csv,text/plain";
const SIDEBAR_DEFAULT = 440;
const SIDEBAR_MIN = 280;
const PREVIEW_MIN = 360;
const AUTOSAVE_MS = 500;

type SaveStatus = "Not saved" | "Saved";

function persist(csv: string, css: string): boolean {
  try {
    localStorage.setItem(CSV_KEY, csv);
    localStorage.setItem(CSS_KEY, css);
    return true;
  } catch {
    return false; // storage blocked or full
  }
}

export default function Playground({ themes }: { themes: Theme[] }) {
  const [csv, setCsv] = useState(DEFAULT_CSV);
  const [css, setCss] = useState(themes[0]?.css ?? "");
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("Not saved");
  const [dataCollapsed, setDataCollapsed] = useState(false);
  const [cssCollapsed, setCssCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const fileInput = useRef<HTMLInputElement>(null);

  // Restore saved work after mount (avoids SSR hydration mismatch).
  useEffect(() => {
    try {
      const savedCsv = localStorage.getItem(CSV_KEY);
      const savedCss = localStorage.getItem(CSS_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedCsv !== null) setCsv(savedCsv);
      if (savedCss !== null) setCss(savedCss);
      if (savedCsv !== null || savedCss !== null) setStatus("Saved");
      const savedWidth = Number(localStorage.getItem(SIDEBAR_KEY));
      if (savedWidth) setSidebarWidth(savedWidth);
    } catch {
      // localStorage unavailable; fall back to defaults.
    }
    setLoaded(true);
  }, []);

  // Autosave shortly after the user stops typing, once saved values were restored.
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(
      () => setStatus(persist(csv, css) ? "Saved" : "Not saved"),
      AUTOSAVE_MS,
    );
    return () => clearTimeout(t);
  }, [csv, css, loaded]);

  function resizeSidebar(width: number) {
    const max = Math.max(SIDEBAR_MIN, window.innerWidth - PREVIEW_MIN);
    const next = Math.round(Math.min(Math.max(width, SIDEBAR_MIN), max));
    setSidebarWidth(next);
    try {
      localStorage.setItem(SIDEBAR_KEY, String(next));
    } catch {
      // storage blocked; width just won't persist
    }
  }

  const theme = themes.find((t) => t.css === css);
  const doc = useMemo(() => withTools(buildDocument(csv, css)), [csv, css]);

  function edit(setter: (v: string) => void) {
    return (v: string) => {
      setStatus("Not saved");
      setter(v);
    };
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    edit(setCsv)(await file.text());
  }

  function onExport() {
    const url = URL.createObjectURL(new Blob([doc], { type: "text/html" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "vizify-table.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(doc);
    } catch {
      // Fallback when the Clipboard API is blocked or the page isn't focused.
      const ta = document.createElement("textarea");
      ta.value = doc;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  }

  return (
    <div className="flex h-screen flex-col bg-sunken">
      <header className="flex h-[56px] shrink-0 items-center gap-[12px] border-b border-line bg-surface px-[16px] py-[8px]">
        <Logo />
        <div className="h-[24px] w-px shrink-0 bg-line" />
        <div className="flex min-w-0 items-center gap-[10px]">
          <span className="whitespace-nowrap text-[15px] font-semibold text-ink">Untitled project</span>
          <span className="whitespace-nowrap font-mono text-[12px] text-ink3">{status}</span>
        </div>
        <div className="min-w-px flex-1" />

        <input
          ref={fileInput}
          type="file"
          accept={CSV_ACCEPT}
          hidden
          onChange={onUpload}
        />
        <Button onClick={() => fileInput.current?.click()}>
          <UploadIcon />
          Upload
        </Button>
        <Button onClick={() => setStatus(persist(csv, css) ? "Saved" : "Not saved")}>
          <SaveIcon />
          Save
        </Button>
        <ExportMenu onDownloadHtml={onExport} onCopyHtml={onCopy} />
        <Button variant="ghost" disabled title="Accounts aren't available in the client-only MVP">
          Sign in
        </Button>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-[8px] p-[8px] md:flex-row md:gap-0">
        <div
          style={{ "--sidebar-w": `${sidebarWidth}px` } as React.CSSProperties}
          className="flex min-h-0 w-full flex-1 flex-col gap-[8px] md:w-(--sidebar-w) md:flex-none"
        >
          <EditorPane
            label="DATA"
            filename="data.csv"
            language="plaintext"
            value={csv}
            collapsed={dataCollapsed}
            onToggle={() => setDataCollapsed((c) => !c)}
            onChange={edit(setCsv)}
          />
          <EditorPane
            label="CSS"
            filename="styles.css"
            action={
              <Select
                label="Theme"
                value={theme?.id ?? "custom"}
                display={`Theme: ${theme?.name ?? "Custom"}`}
                onChange={(id) => edit(setCss)(themes.find((t) => t.id === id)?.css ?? css)}
                options={[
                  ...themes.map((t) => ({
                    value: t.id,
                    label: t.name,
                    hint: t.pro ? "free account" : undefined,
                  })),
                  { value: "custom", label: "Custom", disabled: true },
                ]}
              />
            }
            language="css"
            value={css}
            collapsed={cssCollapsed}
            onToggle={() => setCssCollapsed((c) => !c)}
            onChange={edit(setCss)}
          />
        </div>

        <ResizeHandle
          value={sidebarWidth}
          min={SIDEBAR_MIN}
          onChange={resizeSidebar}
          onReset={() => resizeSidebar(SIDEBAR_DEFAULT)}
        />

        <section className="flex min-h-0 min-w-px flex-1 flex-col overflow-clip rounded-[12px] bg-surface">
          <div className="flex h-[40px] shrink-0 items-center justify-between gap-[12px] border-b border-line bg-paper px-[16px] font-mono text-[12px] text-ink3">
            <span className="font-medium tracking-[0.72px]">PREVIEW</span>
            <span className="flex shrink-0 items-center gap-[6px]">
              <Image src={liveDot} alt="" width={6} height={6} />
              Live
            </span>
          </div>
          {/* Sandboxed without allow-same-origin: only our injected toolbar script runs, isolated from the app. */}
          <iframe title="Table preview" sandbox="allow-scripts" srcDoc={doc} className="min-h-0 flex-1 bg-white" />
        </section>
      </main>
    </div>
  );
}
