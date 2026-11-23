
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
import { AUTH_ENABLED, DEFAULT_VIEW, isViewEnabled } from "@/lib/features";
import { DEFAULT_CSV } from "@/lib/table/defaults";
import { fileToPhoto } from "@/lib/resume/photo";
import { buildDocument } from "@/lib/table/preview";
import { buildResumeDocument } from "@/lib/resume";
import { parseCsv } from "@/lib/csv-parser";
import { importCandidateResumes } from "@/lib/resume/import-csv";
import {
  DEFAULT_RESUME_CSV,
  isResumeSample,
  type ThemeOption,
} from "@/lib/resume/resume";
import {
  DEFAULT_ID_CARD_CSV,
  ID_CARD_THEMES,
  buildIdCardDocument,
} from "@/lib/cards";
import { persist, restore, savePhoto, saveSidebar, type Work } from "@/lib/storage";
import { withTools } from "@/lib/table/tools";
import type { Theme } from "@/lib/table/themes";
import { boardThemeOptions } from "@/lib/jiraboard/board-themes";
import { buildBoardDocument } from "@/lib/jiraboard/render";
import { BOARD_CSV } from "@/lib/jiraboard/sample";
import { buildCardsDocument } from "@/lib/cards/render";
import { CARDS_CSV, LEGACY_CARDS_CSV } from "@/lib/cards/sample";
import { cardsThemeOptions, migrateLegacyCardsThemeCss } from "@/lib/cards/themes";
import { buildCertificatesDocument } from "@/lib/certificates/render";
import { CERTIFICATES_CSV } from "@/lib/certificates/sample";
import { certificatesThemeOptions } from "@/lib/certificates/themes";

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
  const [view, setView] = useState<View>(DEFAULT_VIEW);
  const [data, setData] = useState<Work>({
    table: { csv: DEFAULT_CSV, css: themes[0]?.css ?? "" },
    resume: { csv: DEFAULT_RESUME_CSV, css: resumeThemes[0]?.css ?? "" },
    idcard: {
      csv: DEFAULT_ID_CARD_CSV,
      css: ID_CARD_THEMES[0]?.css ?? "",
    },
    board: { csv: BOARD_CSV, css: boardThemeOptions[0]?.css ?? "" },
    cards: { csv: CARDS_CSV, css: cardsThemeOptions[0]?.css ?? "" },
    certificates: { csv: CERTIFICATES_CSV, css: certificatesThemeOptions[0]?.css ?? "" },
  });
  const [photo, setPhoto] = useState("");
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("Not saved");
  const [dataCollapsed, setDataCollapsed] = useState(false);
  const [cssCollapsed, setCssCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const fileInput = useRef<HTMLInputElement>(null);

  const { csv, css } = data[view];
  // A CSV with one row per person becomes several resumes; the user picks which to preview.
  const candidates = useMemo(
    () => (view === "resume" ? importCandidateResumes(csv) : null),
    [view, csv],
  );
  const activeCandidateIndex =
    candidates && candidates.length > 0 ? Math.min(candidateIndex, candidates.length - 1) : 0;
  const resumeCsv = candidates?.[activeCandidateIndex]?.csv ?? csv;
  const csvPhoto = useMemo(
    () =>
      parseCsv(resumeCsv).find((row) => row[0]?.trim().toLowerCase() === "photo")?.[4]?.trim() ??
      "",
    [resumeCsv],
  );
  const themeList: ThemeOption[] =
    view === "table"
      ? themes
      : view === "resume"
        ? resumeThemes
        : view === "idcard"
          ? ID_CARD_THEMES
          : view === "board"
            ? boardThemeOptions
            : view === "cards"
              ? cardsThemeOptions
              : certificatesThemeOptions;
  const theme = themeList.find((t) => t.css === css);
  const themeId = theme?.id;
  const resumeLayout =
    theme?.id === "resume-graphic"
      ? "graphic"
      : theme?.id === "resume-boardroom"
        ? "executive"
        : theme?.id === "resume-midnight"
          ? "sidebar"
          : theme?.id === "resume-pop"
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
      idcard: {
        csv: saved.work.idcard?.csv ?? current.idcard.csv,
        css: saved.work.idcard?.css ?? current.idcard.css,
      },
      board: {
        csv: saved.work.board?.csv ?? current.board.csv,
        css: saved.work.board?.css ?? current.board.css,
      },
      cards: {
        csv:
          saved.work.cards?.csv?.replace(/\r\n/g, "\n") === LEGACY_CARDS_CSV
            ? CARDS_CSV
            : (saved.work.cards?.csv ?? current.cards.csv),
        css: migrateLegacyCardsThemeCss(saved.work.cards?.css ?? current.cards.css),
      },
      certificates: {
        csv: saved.work.certificates?.csv ?? current.certificates.csv,
        css: saved.work.certificates?.css ?? current.certificates.css,
      },
    }));

    // Only restore a saved view that is currently available.
    if (saved.view && isViewEnabled(saved.view)) setView(saved.view);
    if (
      saved.work.table ||
      saved.work.resume ||
      saved.work.idcard ||
      saved.work.board ||
      saved.work.cards ||
      saved.work.certificates
    )
      setStatus("Saved");
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
      setData((d) => ({
        ...d,
        [view]: { ...d[view], [field]: v },
      }));
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
          : view === "idcard"
            ? buildIdCardDocument(csv, css)
            : view === "board"
              ? buildBoardDocument(csv, css, themeId)
              : view === "cards"
                ? buildCardsDocument(csv, css, true, themeId)
                : view === "certificates"
                  ? buildCertificatesDocument(csv, css, themeId)
                  : buildResumeDocument(resumeCsv, css, photo, resumeLayout);
      return document.replace(/\r\n?/g, "\n");
    },
    [view, csv, resumeCsv, css, photo, resumeLayout, themeId],
  );

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    if (view === "resume") setCandidateIndex(0);
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
      : view === "idcard"
        ? buildIdCardDocument(csv, css)
        : view === "board"
          ? buildBoardDocument(csv, css, themeId, false)
          : view === "cards"
            ? buildCardsDocument(csv, css, false, themeId)
            : view === "certificates"
              ? buildCertificatesDocument(csv, css, themeId, false)
              : buildResumeDocument(resumeCsv, css, photo, resumeLayout);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-sunken">
      <header className="flex min-h-[56px] shrink-0 flex-wrap items-center gap-[8px] border-b border-line bg-surface px-[10px] py-[8px] sm:px-[16px] lg:h-[56px] lg:flex-nowrap lg:gap-[12px]">
        <Logo />

        <span className="sr-only" aria-live="polite">
          {status}
        </span>

        <ViewSwitch value={view} onChange={setView} />

        <div className="hidden min-w-px flex-1 lg:block" />

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

        {AUTH_ENABLED && (
          <Button
            onClick={() =>
              setStatus(persist(view, csv, css) ? "Saved" : "Not saved")
            }
          >
            <SaveIcon />
            Save
          </Button>
        )}

        <ExportMenu
          view={view}
          html={doc}
          csv={csv}
          staticHtml={staticDoc()}
        />

        {AUTH_ENABLED && (
          <Button
            variant="ghost"
            disabled
            title="Accounts aren't available in the client-only MVP"
          >
            Sign in
          </Button>
        )}
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-[8px] overflow-y-auto p-[8px] lg:flex-row lg:gap-0 lg:overflow-hidden">
        <div
          style={{ "--sidebar-w": `${sidebarWidth}px` } as React.CSSProperties}
          className="flex min-h-[480px] w-full shrink-0 flex-col gap-[8px] sm:min-h-[560px] lg:min-h-0 lg:w-(--sidebar-w) lg:flex-none"
        >
          <EditorPane
            label="DATA"
            filename={`${view === "table" ? "data" : view}.csv`}
            action={
              view === "resume" ? (
                <div className="flex items-center gap-[6px]">
                  {candidates && candidates.length > 1 && (
                    <Select
                      label="Candidate"
                      value={String(activeCandidateIndex)}
                      display={`Candidate: ${candidates[activeCandidateIndex]?.name ?? ""}`}
                      onChange={(value) => setCandidateIndex(Number(value))}
                      options={candidates.map((candidate, index) => ({
                        value: String(index),
                        label: candidate.name,
                      }))}
                    />
                  )}
                  {theme?.id !== "resume-ledger" && (
                    <PhotoButton
                      hasPhoto={photo !== "" || csvPhoto !== ""}
                      canRemove={photo !== ""}
                      onPick={onPhoto}
                      onRemove={onRemovePhoto}
                    />
                  )}
                </div>
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

                  if (
                    view === "resume" &&
                    nextTheme.sample &&
                    isResumeSample(csv)
                  ) {
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
