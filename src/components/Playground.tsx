"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import liveDot from "@/assets/icons/live-dot.svg";
import Button from "@/components/Button";
import EditorPane from "@/components/EditorPane";
import ExportMenu from "@/components/ExportMenu";
import { SaveIcon, UploadIcon } from "@/components/Icons";
import Logo from "@/components/Logo";
import PhotoButton from "@/components/PhotoButton";
import ResizeHandle from "@/components/ResizeHandle";
import Select from "@/components/Select";
import ViewSwitch, { type View } from "@/components/ViewSwitch";
import { DEFAULT_CSV } from "@/lib/table/defaults";
import { fileToPhoto } from "@/lib/resume/photo";
import { buildDocument } from "@/lib/table/preview";
import { buildResumeDocument } from "@/lib/resume";
import {
  DEFAULT_RESUME_CSV,
  isResumeSample,
  type ThemeOption,
} from "@/lib/resume/resume";
import { persist, restore, savePhoto, saveSidebar, type Work } from "@/lib/storage";
import { withTools } from "@/lib/table/tools";
import type { Theme } from "@/lib/table/themes";

const CSV_ACCEPT = ".csv,text/csv,text/plain";
const SIDEBAR_DEFAULT = 440;
const SIDEBAR_MIN = 280;
const PREVIEW_MIN = 360;
const AUTOSAVE_MS = 500;

type SaveStatus = "Not saved" | "Saved";

export default function Playground({
  themes,
  resumeThemes,
}: {
  themes: Theme[];
  resumeThemes: ThemeOption[];
}) {
  const [view, setView] = useState<View>("table");
  const [data, setData] = useState<Work>({
    table: { csv: DEFAULT_CSV, css: themes[0]?.css ?? "" },
    resume: { csv: DEFAULT_RESUME_CSV, css: resumeThemes[0]?.css ?? "" },
  });
  const [photo, setPhoto] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("Not saved");
  const [dataCollapsed, setDataCollapsed] = useState(false);
  const [cssCollapsed, setCssCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const fileInput = useRef<HTMLInputElement>(null);

  const { csv, css } = data[view];
  const themeList: ThemeOption[] = view === "table" ? themes : resumeThemes;
  const theme = themeList.find((t) => t.css === css);
  const resumeLayout =
    theme?.id === "resume-graphic"
      ? "graphic"
      : theme?.id === "resume-sidebar"
        ? "sidebar"
        : theme?.id === "resume-uiux"
          ? "uiux"
          : undefined;

  // Restore saved work after mount (avoids SSR hydration mismatch).
  useEffect(() => {
    const saved = restore();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData((current) => ({
      table: {
        csv: saved.work.table?.csv ?? current.table.csv,
        css: saved.work.table?.css ?? current.table.css,
      },
      resume: {
        csv: saved.work.resume?.csv ?? current.resume.csv,
        css: saved.work.resume?.css ?? current.resume.css,
      },
    }));
    if (saved.view) setView(saved.view);
    if (saved.work.table || saved.work.resume) setStatus("Saved");
    if (saved.sidebar) setSidebarWidth(saved.sidebar);
    if (saved.photo) setPhoto(saved.photo);
    setLoaded(true);
  }, []);

  // Autosave shortly after the user stops typing, once saved values were restored.
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(
      () => setStatus(persist(view, csv, css) ? "Saved" : "Not saved"),
      AUTOSAVE_MS,
    );
    return () => clearTimeout(t);
  }, [view, csv, css, loaded]);

  function resizeSidebar(width: number) {
    const max = Math.max(SIDEBAR_MIN, window.innerWidth - PREVIEW_MIN);
    const next = Math.round(Math.min(Math.max(width, SIDEBAR_MIN), max));
    setSidebarWidth(next);
    saveSidebar(next);
  }

  function update(field: "csv" | "css") {
    return (v: string) => {
      setStatus("Not saved");
      setData((d) => ({ ...d, [view]: { ...d[view], [field]: v } }));
    };
  }
  const setCsv = update("csv");
  const setCss = update("css");
  const onCsvChange = setCsv;
  const onCssChange = setCss;

  const doc = useMemo(
    () => {
      const document =
        view === "table"
          ? withTools(buildDocument(csv, css))
          : buildResumeDocument(csv, css, photo, resumeLayout);
      return document.replace(/\r\n?/g, "\n");
    },
    [view, csv, css, photo, resumeLayout],
  );

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    onCsvChange(await file.text());
  }

  async function onPhoto(file: File) {
    try {
      const url = await fileToPhoto(file);
      setPhoto(url);
      setStatus(savePhoto(url) ? "Saved" : "Not saved");
    } catch {
      // unreadable image: keep the current photo
    }
  }

  function onRemovePhoto() {
    setPhoto("");
    setStatus(savePhoto("") ? "Saved" : "Not saved");
  }

  // PDF uses a static copy: all rows, no script.
  const staticDoc = () =>
    view === "table"
      ? buildDocument(csv, css, false)
      : buildResumeDocument(csv, css, photo, resumeLayout);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-sunken">
      <header className="flex min-h-[56px] shrink-0 flex-wrap items-center gap-[8px] border-b border-line bg-surface px-[10px] py-[8px] sm:px-[16px] lg:h-[56px] lg:flex-nowrap lg:gap-[12px]">
        <Logo />
        <div className="hidden h-[24px] w-px shrink-0 bg-line lg:block" />
        <div className="hidden min-w-0 items-center gap-[10px] lg:flex">
          <span className="whitespace-nowrap text-[15px] font-semibold text-ink">Untitled project</span>
          <span className="whitespace-nowrap font-mono text-[12px] text-ink3">{status}</span>
        </div>
        <ViewSwitch value={view} onChange={setView} />
        <div className="hidden min-w-px flex-1 lg:block" />

        <input ref={fileInput} type="file" accept={CSV_ACCEPT} hidden onChange={onUpload} />
        <Button onClick={() => fileInput.current?.click()}>
          <UploadIcon />
          Upload
        </Button>
        <Button onClick={() => setStatus(persist(view, csv, css) ? "Saved" : "Not saved")}>
          <SaveIcon />
          Save
        </Button>
        <ExportMenu view={view} html={doc} csv={csv} staticHtml={staticDoc()} />
        <Button variant="ghost" disabled title="Accounts aren't available in the client-only MVP">
          Sign in
        </Button>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-[8px] overflow-y-auto p-[8px] lg:flex-row lg:gap-0 lg:overflow-hidden">
        <div
          style={{ "--sidebar-w": `${sidebarWidth}px` } as React.CSSProperties}
          className="flex min-h-[480px] w-full shrink-0 flex-col gap-[8px] sm:min-h-[560px] lg:min-h-0 lg:w-(--sidebar-w) lg:flex-none"
        >
          <EditorPane
            label="DATA"
            filename={view === "table" ? "data.csv" : "resume.csv"}
            action={
              view === "resume" ? (
                <PhotoButton hasPhoto={photo !== ""} onPick={onPhoto} onRemove={onRemovePhoto} />
              ) : undefined
            }
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
                onChange={(id) => {
                  const nextTheme = themeList.find((t) => t.id === id);
                  if (!nextTheme) return;
                  setCss(nextTheme.css);
                  if (view === "resume" && nextTheme.sample && isResumeSample(csv)) {
                    setCsv(nextTheme.sample);
                  }
                }}
                options={[
                  ...themeList.map((t) => ({
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

        <section className="flex min-h-[65vh] min-w-px shrink-0 flex-col overflow-clip rounded-[12px] bg-surface lg:min-h-0 lg:flex-1">
          <div className="flex h-[40px] shrink-0 items-center justify-between gap-[12px] border-b border-line bg-paper px-[16px] font-mono text-[12px] text-ink3">
            <span className="font-medium tracking-[0.72px]">PREVIEW</span>
            <span className="flex shrink-0 items-center gap-[6px]">
              <Image src={liveDot} alt="" width={6} height={6} />
              Live
            </span>
          </div>
          {/* Sandboxed without allow-same-origin: only our injected scripts run, isolated from the app. */}
          <iframe
            title="Preview"
            sandbox="allow-scripts"
            srcDoc={loaded ? doc : ""}
            className="min-h-0 flex-1 bg-white"
          />
        </section>
      </main>
    </div>
  );
}