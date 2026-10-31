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
import { copyText, download, printHtml } from "@/lib/export";
import { buildDocument } from "@/lib/table/preview";
import { persist, restore, saveSidebar } from "@/lib/storage";
import { withTools } from "@/lib/table/tools";
import type { Theme } from "@/lib/table/themes";

const SIDEBAR_DEFAULT = 440;
const SIDEBAR_MIN = 280;
const PREVIEW_MIN = 360;
const AUTOSAVE_MS = 500;
const CSV_ACCEPT = ".csv,text/csv,text/plain";

type SaveStatus = "Not saved" | "Saved";

export default function Playground({ themes }: { themes: Theme[] }) {
  const [csv, setCsv] = useState(DEFAULT_CSV);
  const [css, setCss] = useState(themes[0]?.css ?? "");
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("Not saved");
  const [dataCollapsed, setDataCollapsed] = useState(false);
  const [cssCollapsed, setCssCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const fileInput = useRef<HTMLInputElement>(null);

  const theme = themes.find((t) => t.css === css);

  // Restore saved work after mount (avoids SSR hydration mismatch).
  useEffect(() => {
    const saved = restore();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved.csv !== null) setCsv(saved.csv);
    if (saved.css !== null) setCss(saved.css);
    if (saved.csv !== null || saved.css !== null) setStatus("Saved");
    if (saved.sidebar) setSidebarWidth(saved.sidebar);
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
    saveSidebar(next);
  }

  const onCsvChange = (value: string) => {
    setStatus("Not saved");
    setCsv(value);
  };
  const onCssChange = (value: string) => {
    setStatus("Not saved");
    setCss(value);
  };
  const doc = useMemo(() => withTools(buildDocument(csv, css)), [csv, css]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    onCsvChange(await file.text());
  }

  // PDF uses a static copy: all rows, no script.
  const staticDoc = () => buildDocument(csv, css, false);

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
        <ExportMenu
          onDownloadHtml={() => download(doc, "text/html", "vizify-table.html")}
          onDownloadCsv={() => download(csv, "text/csv;charset=utf-8", "vizify-table.csv")}
          onDownloadPdf={() => printHtml(staticDoc())}
          onCopyHtml={() => copyText(doc)}
        />
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
            onChange={onCsvChange}
          />
          <EditorPane
            label="CSS"
            filename="styles.css"
            action={
              <Select
                label="Theme"
                value={theme?.id ?? "custom"}
                display={`Theme: ${theme?.name ?? "Custom"}`}
                onChange={(id) => onCssChange(themes.find((t) => t.id === id)?.css ?? css)}
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
            onChange={onCssChange}
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
          {/* Sandboxed without allow-same-origin: only our injected scripts run, isolated from the app. */}
          <iframe title="Preview" sandbox="allow-scripts" srcDoc={doc} className="min-h-0 flex-1 bg-white" />
        </section>
      </main>
    </div>
  );
}