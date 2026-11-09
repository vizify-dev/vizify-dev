"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import liveDot from "@/assets/icons/live-dot.svg";
import Button from "@/components/Button";
import EditorPane from "@/components/EditorPane";
import ExportMenu from "@/components/ExportMenu";
import { SaveIcon, ShareIcon, UploadIcon } from "@/components/Icons";
import Logo from "@/components/Logo";
import PhotoButton from "@/components/PhotoButton";
import ResizeHandle from "@/components/ResizeHandle";
import Select from "@/components/Select";
import TableEditor from "@/components/TableEditor";
import ViewSwitch, { type View } from "@/components/ViewSwitch";
import { DEFAULT_CSV } from "@/lib/table/defaults";
import { copyText, download, printHtml } from "@/lib/export";
import { fileToPhoto } from "@/lib/resume/photo";
import { buildDocument } from "@/lib/table/preview";
import { buildResumeDocument } from "@/lib/resume";

import {
  DEFAULT_RESUME_CSV,
  isResumeSample,
  type ThemeOption,
} from "@/lib/resume/resume";
import {
  clearWork,
  hasHandedOff,
  markHandedOff,
  persist,
  restore,
  savePhoto,
  saveSidebar,
  VIEWS,
  type Work,
} from "@/lib/storage";
import { withTools } from "@/lib/table/tools";
import type { Theme } from "@/lib/table/themes";
import { boardThemeOptions } from "@/lib/jiraboard/board-themes";
import { buildBoardDocument } from "@/lib/jiraboard/render";
import { BOARD_CSV } from "@/lib/jiraboard/sample";
import { buildCardsDocument } from "@/lib/cards/render";
import { CARDS_CSV, LEGACY_CARDS_CSV } from "@/lib/cards/sample";
import { cardsThemeOptions } from "@/lib/cards/themes";
import { buildIdCardDocument, ID_CARD_THEMES } from "@/lib/cards";
import { buildCertificatesDocument } from "@/lib/certificates/render";
import { CERTIFICATES_CSV } from "@/lib/certificates/sample";
import { certificatesThemeOptions } from "@/lib/certificates/themes";
import { parseCsv } from "@/lib/csv-parser";
import { withEditing } from "@/lib/edit";
import { toCsv } from "@/lib/csv-serialize";
import AuthButton from "@/components/AuthButton";
import { authClient } from "@/lib/auth-client";
import SignupModal from "@/components/SignupModal";
import { can, isPlan, type Plan } from "@/lib/plans";
import MyProjectsMenu, { type ProjectSummary } from "@/components/MyProjectsMenu";
import ProjectTitle from "@/components/ProjectTitle";

const CSV_ACCEPT = ".csv,text/csv,text/plain";
const SIDEBAR_DEFAULT = 380;
const SIDEBAR_MIN = 280;
const PREVIEW_MIN = 360;
const AUTOSAVE_MS = 500;
const CLOUD_AUTOSAVE_MS = 1500;
const CARD_THEME_OPTIONS = [...ID_CARD_THEMES, ...cardsThemeOptions];
const EDIT_LABELS: Record<View, string> = {
  table: "Edit table",
  resume: "Edit resume data",
  board: "Edit board data",
  cards: "Edit card data",
  certificates: "Edit certificate data",
};
type SaveStatus = "Not saved" | "Saving…" | "Saved";
type SaveToast = { kind: "success" | "error"; message: string };

const defaultsFor = (view: View, themes: Theme[], resumeThemes: ThemeOption[]) => {
  if (view === "table") return { csv: DEFAULT_CSV, css: themes[0]?.css ?? "" };
  if (view === "resume") return { csv: DEFAULT_RESUME_CSV, css: resumeThemes[0]?.css ?? "" };
  if (view === "board") return { csv: BOARD_CSV, css: boardThemeOptions[0]?.css ?? "" };
  if (view === "cards") return { csv: CARDS_CSV, css: cardsThemeOptions[0]?.css ?? "" };
  return { csv: CERTIFICATES_CSV, css: certificatesThemeOptions[0]?.css ?? "" };
};

const themeOptionsFor = (view: View, themes: Theme[], resumeThemes: ThemeOption[]): ThemeOption[] => {
  if (view === "table") return themes;
  if (view === "resume") return resumeThemes;
  if (view === "board") return boardThemeOptions;
  if (view === "cards") return CARD_THEME_OPTIONS;
  return certificatesThemeOptions;
};

const PROJECT_NAMES: Record<View, string> = {
  table: "My table",
  resume: "My resume",
  board: "My Jira board",
  cards: "My ID cards",
  certificates: "My certificates",
};

export default function Playground({
  themes,
  resumeThemes,
}: {
  themes: Theme[];
  resumeThemes: ThemeOption[];
}) {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const userId = user?.id;
  const plan: Plan = !user ? "guest" : isPlan(user.plan) && user.plan !== "guest" ? user.plan : "free";
  const [view, setView] = useState<View>("table");
  const [data, setData] = useState<Work>({
    table: { csv: DEFAULT_CSV, css: themes[0]?.css ?? "" },
    resume: { csv: DEFAULT_RESUME_CSV, css: resumeThemes[0]?.css ?? "" },
    board: { csv: BOARD_CSV, css: boardThemeOptions[0]?.css ?? "" },
    cards: { csv: CARDS_CSV, css: cardsThemeOptions[0]?.css ?? "" },
    certificates: { csv: CERTIFICATES_CSV, css: certificatesThemeOptions[0]?.css ?? "" },
  });
  const [photo, setPhoto] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [cloudReadyUserId, setCloudReadyUserId] = useState<string | null>(null);
  const [projectIds, setProjectIds] = useState<Partial<Record<View, string>>>({});
  const [projectNames, setProjectNames] = useState<Partial<Record<View, string>>>({});
  const [dirtyViews, setDirtyViews] = useState<Partial<Record<View, boolean>>>({});
  const [status, setStatus] = useState<SaveStatus>("Not saved");
  const [saveToast, setSaveToast] = useState<SaveToast | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [dataCollapsed, setDataCollapsed] = useState(false);
  const [cssCollapsed, setCssCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const [signInOpen, setSignInOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<"in" | "up">("in");
  const [authShowSignupForm, setAuthShowSignupForm] = useState(true);
  const [authRequestKey, setAuthRequestKey] = useState(0);
  const [signupOpen, setSignupOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const skipTablePreviewRefresh = useRef(false);
  const dataRef = useRef(data);
  const handedOff = useRef(false);
  const dirtyRevisions = useRef<Partial<Record<View, number>>>({});
  const failedRevisions = useRef<Partial<Record<View, number>>>({});
  const [scrollY, setScrollY] = useState(0);
  const [renderKey, setRenderKey] = useState(0);
  const [frameDoc, setFrameDoc] = useState("");

  const { csv, css } = data[view];
  const editLabel = EDIT_LABELS[view];
  const requireAccount = useCallback(() => setSignupOpen(true), []);
  const openAuth = (mode: "in" | "up", showSignupForm = true) => {
    setSignupOpen(false);
    setAuthInitialMode(mode);
    setAuthShowSignupForm(showSignupForm);
    setAuthRequestKey((key) => key + 1);
    setSignInOpen(true);
  };
  const clearDirty = useCallback((targetView: View) => {
    setDirtyViews((previous) => {
      const next = { ...previous };
      delete next[targetView];
      return next;
    });
  }, []);
  const projectName = projectNames[view] ?? "Untitled project";
  async function copyShareLink() {
    const projectId = projectIds[view];
    if (!projectId || dirtyViews[view] || saving) return;
    await copyText(`${window.location.origin}/s/${encodeURIComponent(projectId)}`);
    setSaveToast({ kind: "success", message: "Public share link copied." });
  }

  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  const themeList: ThemeOption[] =
    view === "table"
      ? themes
      : view === "resume"
        ? resumeThemes
        : view === "board"
          ? boardThemeOptions
          : view === "cards"
            ? CARD_THEME_OPTIONS
            : certificatesThemeOptions;
  const theme = themeList.find((t) => t.css === css);
  const resumeLayout =
    theme?.id === "resume-graphic"
      ? "graphic"
      : theme?.id === "resume-sidebar"
        ? "sidebar"
        : theme?.id === "resume-uiux"
          ? "uiux"
          : undefined;

  useEffect(() => {
    if (!saveToast) return;
    const timeout = setTimeout(() => setSaveToast(null), 3000);
    return () => clearTimeout(timeout);
  }, [saveToast]);

  useEffect(() => {
    if (!userId) return;
    const accountId = userId;
    let active = true;
    async function loadProjects() {
      try {
        const response = await fetch("/api/projects");
        if (!response.ok) throw new Error("Couldn't load your saved projects.");
        const projects = (await response.json()) as ProjectSummary[];
        const latestByView = new Map<View, ProjectSummary>();
        for (const project of projects) {
          if (VIEWS.includes(project.view as View) && !latestByView.has(project.view as View)) {
            latestByView.set(project.view as View, project);
          }
        }

        const loadedProjects = await Promise.all(
          [...latestByView.entries()].map(async ([projectView, summary]) => {
            const projectResponse = await fetch(`/api/projects/${summary.id}`);
            if (!projectResponse.ok) throw new Error("Couldn't load a saved project.");
            const project = (await projectResponse.json()) as { csv: string; css: string };
            return {
              view: projectView,
              id: summary.id,
              name: summary.name,
              csv: project.csv,
              css: project.css,
            };
          }),
        );
        if (!active) return;

        const ids: Partial<Record<View, string>> = {};
        const names: Partial<Record<View, string>> = {};
        for (const project of loadedProjects) ids[project.view] = project.id;
        for (const project of loadedProjects) names[project.view] = project.name;
        setProjectIds(ids);
        setProjectNames(names);
        setData((previous) => {
          const next = { ...previous };
          for (const project of loadedProjects) {
            next[project.view] = { csv: project.csv, css: project.css };
          }
          return next;
        });
        setCloudReadyUserId(accountId);
      } catch (error) {
        if (!active) return;
        setSaveToast({
          kind: "error",
          message: error instanceof Error ? error.message : "Couldn't load your saved projects.",
        });
      }
    }
    void loadProjects();
    return () => {
      active = false;
    };
  }, [userId]);
  // Restore saved work after mount (avoids SSR hydration mismatch).
  useEffect(() => {
    const saved = restore();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData((prev) => {
      const next = { ...prev };
      for (const v of VIEWS) {
        const r = saved.work[v];
        if (r) next[v] = { csv: r.csv ?? prev[v].csv, css: r.css ?? prev[v].css };
      }
      if (saved.work.cards?.csv?.replace(/\r\n/g, "\n") === LEGACY_CARDS_CSV) {
        next.cards = { ...next.cards, csv: CARDS_CSV };
      }
      return next;
    });
    if (Object.keys(saved.work).length > 0) setStatus("Saved");
    if (saved.view) setView(saved.view);
    if (saved.sidebar) setSidebarWidth(saved.sidebar);
    if (saved.photo) setPhoto(saved.photo);
    setLoaded(true);
  }, []);

  async function renameProject(name: string) {
    setProjectNames((previous) => ({ ...previous, [view]: name }));
    const id = projectIds[view];
    if (!id) return;
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error("Couldn't rename this project.");
      setSaveToast({ kind: "success", message: "Project renamed." });
    } catch (error) {
      setStatus("Not saved");
      setSaveToast({
        kind: "error",
        message: error instanceof Error ? error.message : "Couldn't rename this project.",
      });
    }
  }

  const saveProject = useCallback(async (
    targetView: View,
    revision = dirtyRevisions.current[targetView] ?? 0,
    manual = true,
  ) => {
    if (!userId || !can(plan, "saveProject")) {
      requireAccount();
      return;
    }
    if (saving) return;
    if (cloudReadyUserId !== userId) {
      if (manual) {
        setSaveToast({ kind: "error", message: "Your projects are still loading. Please try again." });
      }
      return;
    }
    const targetData = data[targetView];
    const projectId = projectIds[targetView];
    const targetThemeList: ThemeOption[] =
      targetView === "table"
        ? themes
        : targetView === "resume"
          ? resumeThemes
          : targetView === "board"
            ? boardThemeOptions
            : targetView === "cards"
              ? CARD_THEME_OPTIONS
              : certificatesThemeOptions;
    const targetTheme = targetThemeList.find((option) => option.css === targetData.css);
    const payload = {
      name: projectNames[targetView] ?? "Untitled project",
      ...targetData,
      view: targetView,
      themeId: targetTheme?.id ?? null,
    };

    setSaving(true);
    setStatus("Saving…");
    setSaveToast(null);
    persist(targetView, targetData.csv, targetData.css);
    try {
      const response = await fetch(projectId ? `/api/projects/${projectId}` : "/api/projects", {
        method: projectId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(result?.message ?? "Couldn't save to your account. Please try again.");
      }

      if (!projectId) {
        const created = (await response.json()) as { id: string };
        setProjectIds((previous) => ({ ...previous, [targetView]: created.id }));
      }
      const unchanged = dirtyRevisions.current[targetView] === revision;
      if (unchanged) {
        clearDirty(targetView);
        delete failedRevisions.current[targetView];
      }
      setStatus(unchanged ? "Saved" : "Not saved");
      setSaveToast({
        kind: "success",
        message: unchanged ? "Saved to your account." : "Saved. Syncing your latest edits…",
      });
    } catch (error) {
      failedRevisions.current[targetView] = revision;
      setStatus("Not saved");
      setSaveToast({
        kind: "error",
        message: error instanceof Error ? error.message : "Couldn't save your work. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }, [userId, plan, saving, cloudReadyUserId, data, projectIds, projectNames, themes, resumeThemes, requireAccount, clearDirty]);

  // Persist guest drafts quickly; debounce authenticated cloud saves to avoid noisy requests.
  useEffect(() => {
    if (!loaded) return;
    if (userId && cloudReadyUserId !== userId) return; // don't overwrite cloud data with defaults
    if (saving) return;
    const pendingView = VIEWS.find((candidate) => {
      const revision = dirtyRevisions.current[candidate] ?? 0;
      return dirtyViews[candidate] && failedRevisions.current[candidate] !== revision;
    });
    if (!pendingView) return;
    const revision = dirtyRevisions.current[pendingView] ?? 0;
    const autosaveDelay = userId ? CLOUD_AUTOSAVE_MS : AUTOSAVE_MS;
    const t = setTimeout(() => {
      if (!userId) {
        const saved = persist(pendingView, data[pendingView].csv, data[pendingView].css);
        setStatus(saved ? "Saved" : "Not saved");
        if (saved && dirtyRevisions.current[pendingView] === revision) clearDirty(pendingView);
        return;
      }
      void saveProject(pendingView, revision, false);
    }, autosaveDelay);
    return () => clearTimeout(t);
  }, [data, loaded, userId, cloudReadyUserId, dirtyViews, saving, saveProject, clearDirty]);

  useEffect(() => {
    if (!loaded || !userId || cloudReadyUserId !== userId || handedOff.current) return;
    const accountId = userId;
    handedOff.current = true;
    if (hasHandedOff(accountId)) return;

    async function handoffGuestWork() {
      try {
        const listResponse = await fetch("/api/projects");
        if (!listResponse.ok) throw new Error("Couldn't check your saved projects.");
        const existing = (await listResponse.json()) as ProjectSummary[];
        if (existing.length > 0) {
          markHandedOff(accountId);
          return;
        }

        const ids: Partial<Record<View, string>> = {};
        const names: Partial<Record<View, string>> = {};
        let failedImport = false;
        for (const projectView of VIEWS) {
          const { csv, css } = dataRef.current[projectView];
          const defaults = defaultsFor(projectView, themes, resumeThemes);
          if (csv === defaults.csv && css === defaults.css) continue;

          const name = PROJECT_NAMES[projectView];
          const options = themeOptionsFor(projectView, themes, resumeThemes);
          const response = await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              view: projectView,
              csv,
              css,
              themeId: options.find((option) => option.css === css)?.id ?? null,
            }),
          });
          if (!response.ok) {
            failedImport = true;
            continue;
          }
          const created = (await response.json()) as { id: string };
          ids[projectView] = created.id;
          names[projectView] = name;
        }

        markHandedOff(accountId);
        if (Object.keys(ids).length > 0) {
          setProjectIds((previous) => ({ ...previous, ...ids }));
          setProjectNames((previous) => ({ ...previous, ...names }));
          setStatus("Saved");
        }
        if (failedImport) {
          setSaveToast({
            kind: "error",
            message: "Some local work couldn't be imported. Your local drafts are still available.",
          });
        }
      } catch {
        handedOff.current = false;
        setSaveToast({
          kind: "error",
          message: "Couldn't import local drafts. They'll remain on this device.",
        });
      }
    }

    void handoffGuestWork();
  }, [loaded, userId, cloudReadyUserId, themes, resumeThemes]);

  async function openProject(id: string) {
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) throw new Error("Couldn't open this project.");
      const project = (await response.json()) as {
        id: string;
        name: string;
        view: string;
        csv: string;
        css: string;
      };
      if (!VIEWS.includes(project.view as View)) throw new Error("This project has an unsupported view.");

      const projectView = project.view as View;
      setView(projectView);
      setData((previous) => ({
        ...previous,
        [projectView]: { csv: project.csv, css: project.css },
      }));
      setProjectIds((previous) => ({ ...previous, [projectView]: project.id }));
      setProjectNames((previous) => ({ ...previous, [projectView]: project.name }));
      clearDirty(projectView);
      delete dirtyRevisions.current[projectView];
      delete failedRevisions.current[projectView];
      setStatus("Saved");
    } catch (error) {
      setSaveToast({
        kind: "error",
        message: error instanceof Error ? error.message : "Couldn't open this project.",
      });
    }
  }

  function newProject() {
    if (status !== "Saved" && !window.confirm("Discard unsaved changes?")) return;
    setData((previous) => ({
      ...previous,
      [view]: defaultsFor(view, themes, resumeThemes),
    }));
    setProjectIds((previous) => ({ ...previous, [view]: undefined }));
    setProjectNames((previous) => ({ ...previous, [view]: undefined }));
    clearDirty(view);
    delete dirtyRevisions.current[view];
    delete failedRevisions.current[view];
    setStatus("Not saved");
  }

  function signOut() {
    clearWork();
    setPhoto("");
    setData({
      table: defaultsFor("table", themes, resumeThemes),
      resume: defaultsFor("resume", themes, resumeThemes),
      board: defaultsFor("board", themes, resumeThemes),
      cards: defaultsFor("cards", themes, resumeThemes),
      certificates: defaultsFor("certificates", themes, resumeThemes),
    });
    setProjectIds({});
    setProjectNames({});
    setDirtyViews({});
    dirtyRevisions.current = {};
    failedRevisions.current = {};
    handedOff.current = false;
    setCloudReadyUserId(null);
    setStatus("Not saved");
    void authClient.signOut();
  }

  function resizeSidebar(width: number) {
    const max = Math.max(SIDEBAR_MIN, window.innerWidth - PREVIEW_MIN);
    const next = Math.round(Math.min(Math.max(width, SIDEBAR_MIN), max));
    setSidebarWidth(next);
    saveSidebar(next);
  }

  function update(field: "csv" | "css") {
    return (v: string) => {
      dirtyRevisions.current[view] = (dirtyRevisions.current[view] ?? 0) + 1;
      setDirtyViews((previous) => ({ ...previous, [view]: true }));
      setStatus("Not saved");
      setData((d) => ({ ...d, [view]: { ...d[view], [field]: v } }));
    };
  }
  const setCsv = update("csv");
  const setCss = update("css");

  const doc = useMemo(
    () =>
      view === "table"
        ? withTools(buildDocument(csv, css))
        : view === "board"
          ? buildBoardDocument(csv, css, theme?.id)
          : view === "cards"
            ? theme?.id.startsWith("id-")
              ? buildIdCardDocument(csv, css)
              : buildCardsDocument(csv, css)
            : view === "certificates"
              ? buildCertificatesDocument(csv, css, theme?.id)
              : buildResumeDocument(csv, css, photo, resumeLayout),
    [view, csv, css, photo, resumeLayout, theme?.id],
  );
  const previewDoc = useMemo(
    () => (user ? withEditing(doc, scrollY) : doc),
    [doc, user, scrollY],
  );

  useEffect(() => {
    if (skipTablePreviewRefresh.current && view === "table") {
      skipTablePreviewRefresh.current = false;
      return;
    }
    skipTablePreviewRefresh.current = false;
    setFrameDoc(previewDoc);
  }, [previewDoc, view]);

  useEffect(() => {
    if (!user) return;
    function onMessage(e: MessageEvent) {
      if (e.source !== frame.current?.contentWindow) return;
      const m: unknown = e.data;
      if (typeof m !== "object" || m === null) return;
      const message = m as {
        source?: unknown;
        value?: unknown;
        row?: unknown;
        col?: unknown;
        scroll?: unknown;
      };
      if (
        message.source !== "cssv-edit" ||
        typeof message.value !== "string" ||
        message.value.length > 5000 ||
        typeof message.row !== "number" ||
        !Number.isInteger(message.row) ||
        message.row < 1 ||
        typeof message.col !== "number" ||
        !Number.isInteger(message.col) ||
        message.col < 0 ||
        message.col > 500
      ) {
        return;
      }

      const rowIndex = message.row;
      const column = message.col;
      const value = message.value;
      const currentGrid = parseCsv(data[view].csv);
      if (!currentGrid[rowIndex]) return;

      if (view === "table") skipTablePreviewRefresh.current = true;
      setData((previous) => {
        const grid = parseCsv(previous[view].csv);
        if (!grid[rowIndex]) return previous;
        const columnCount = Math.max(column + 1, ...grid.map((row) => row.length));
        grid[rowIndex] = [
          ...grid[rowIndex],
          ...Array<string>(columnCount - grid[rowIndex].length).fill(""),
        ];
        grid[rowIndex][column] = value;
        return { ...previous, [view]: { ...previous[view], csv: toCsv(grid) } };
      });
      dirtyRevisions.current[view] = (dirtyRevisions.current[view] ?? 0) + 1;
      setDirtyViews((previous) => ({ ...previous, [view]: true }));
      setStatus("Not saved");

      if (view !== "table") {
        const requestedScroll = Number(message.scroll);
        setScrollY(
          Number.isFinite(requestedScroll)
            ? Math.max(0, Math.min(1_000_000, requestedScroll))
            : 0,
        );
        setRenderKey((key) => key + 1);
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [data, user, view]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCsv(await file.text());
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
    savePhoto("");
  }

  // PDF uses a static copy: all rows, no script.
  const staticDoc = () =>
    view === "table"
      ? buildDocument(csv, css, false)
      : view === "board"
        ? buildBoardDocument(csv, css, theme?.id, false)
        : view === "cards"
          ? theme?.id.startsWith("id-")
            ? buildIdCardDocument(csv, css)
            : buildCardsDocument(csv, css, false)
          : view === "certificates"
            ? buildCertificatesDocument(csv, css, theme?.id, false)
            : buildResumeDocument(csv, css, photo, resumeLayout);

  return (
    <div className="flex h-screen flex-col bg-sunken">
      <header className="flex h-[56px] shrink-0 items-center gap-[10px] border-b border-line bg-surface px-[16px]">
        <Logo />
        <div className="h-[24px] w-px shrink-0 bg-line" />

        <div className="flex min-w-0 items-center gap-[8px]">
          <ProjectTitle value={projectName} onCommit={renameProject} />
          <span
            title={status}
            aria-label={status}
            className={`size-[8px] shrink-0 rounded-full ${
              status === "Saved"
                ? "bg-green-500"
                : status === "Saving…"
                  ? "bg-amber-400"
                  : "bg-ink3/50"
            }`}
          />
        </div>

        <div className="hidden h-[24px] w-px shrink-0 bg-line md:block" />
        <div className="hidden md:block">
          <ViewSwitch
            value={view}
            onChange={(nextView) => {
              setScrollY(0);
              setView(nextView);
            }}
          />
        </div>

        <div className="min-w-px flex-1" />

        <input ref={fileInput} type="file" accept={CSV_ACCEPT} hidden onChange={onUpload} />

        {session?.user && (
          <MyProjectsMenu
            activeId={projectIds[view]}
            onOpen={(id) => void openProject(id)}
            onNew={newProject}
            onDeleted={(project) => {
              if (!VIEWS.includes(project.view as View)) return;
              const deletedView = project.view as View;
              const wasActive = projectIds[deletedView] === project.id;
              setProjectIds((ids) =>
                ids[deletedView] === project.id
                  ? { ...ids, [deletedView]: undefined }
                  : ids,
              );
              setProjectNames((names) =>
                wasActive ? { ...names, [deletedView]: undefined } : names,
              );
              if (wasActive) {
                setData((previous) => ({
                  ...previous,
                  [deletedView]: defaultsFor(deletedView, themes, resumeThemes),
                }));
                clearDirty(deletedView);
                delete dirtyRevisions.current[deletedView];
                delete failedRevisions.current[deletedView];
                setStatus("Not saved");
              }
            }}
          />
        )}

        {session?.user && (
          <Button
            aria-label="Copy public share link"
            title={
              !projectIds[view]
                ? "Save this project to share it"
                : dirtyViews[view]
                  ? "Wait for changes to save before sharing"
                  : "Copy public share link"
            }
            onClick={() => void copyShareLink()}
            disabled={!projectIds[view] || Boolean(dirtyViews[view]) || saving}
          >
            <ShareIcon />
            <span className="hidden 2xl:inline">Share</span>
          </Button>
        )}

        <Button
          aria-label="Upload CSV"
          title="Upload CSV"
          onClick={() => fileInput.current?.click()}
        >
          <UploadIcon />
          <span className="hidden 2xl:inline">Upload</span>
        </Button>
        <Button
          aria-label="Save"
          title="Save"
          onClick={() => void saveProject(view)}
          disabled={saving}
        >
          <SaveIcon />
          <span className="hidden 2xl:inline">{saving ? "Saving…" : "Save"}</span>
        </Button>
        <Button
          onClick={() => {
            if (session?.user) {
              setEditing(true);
              return;
            }
            openAuth("up", false);
          }}
          title={session?.user ? editLabel : "Sign in to edit data"}
          aria-label={session?.user ? editLabel : "Sign in to edit data"}
        >
          Edit data{!session?.user && " 🔒"}
        </Button>

        <ExportMenu
          onDownloadHtml={() => download(doc, "text/html", `vizify-${view}.html`)}
          onDownloadCsv={() => download(csv, "text/csv;charset=utf-8", `vizify-${view}.csv`)}
          onDownloadPdf={() => printHtml(staticDoc(), { fitResumeToPage: view === "resume" })}
          onCopyHtml={() => copyText(doc)}
        />
        <AuthButton
          key={authRequestKey}
          open={signInOpen}
          onOpenChange={setSignInOpen}
          initialMode={authInitialMode}
          initialShowSignupForm={authShowSignupForm}
          onSignOut={signOut}
        />
        <SignupModal
          open={signupOpen}
          onClose={() => setSignupOpen(false)}
          onSignup={() => openAuth("up")}
          onSignin={() => openAuth("in")}
        />
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-[8px] p-[8px] md:flex-row md:gap-0">
        <div
          style={{ "--sidebar-w": `${sidebarWidth}px` } as React.CSSProperties}
          className="flex min-h-0 w-full flex-1 flex-col gap-[8px] md:w-(--sidebar-w) md:flex-none"
        >
          <EditorPane
            label="DATA"
            filename={`${view === "table" ? "data" : view}.csv`}
            action={
              view === "resume" ? (
                <PhotoButton hasPhoto={photo !== ""} onPick={onPhoto} onRemove={onRemovePhoto} />
              ) : undefined
            }
            language="plaintext"
            value={csv}
            collapsed={dataCollapsed}
            onToggle={() => setDataCollapsed((c) => !c)}
            onChange={setCsv}
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
                  if (nextTheme.pro && !can(plan, "premiumThemes")) {
                    if (user) {
                      setSaveToast({ kind: "error", message: "Premium themes require a Pro plan." });
                    } else {
                      requireAccount();
                    }
                    return;
                  }
                  setCss(nextTheme.css);
                  if (view === "resume" && nextTheme.sample && isResumeSample(csv)) {
                    setCsv(nextTheme.sample);
                  }
                }}
                options={[
                  ...themeList.map((t) => ({
                    value: t.id,
                    label: t.name,
                    hint: t.pro ? "Pro" : undefined,
                  })),
                  { value: "custom", label: "Custom", disabled: true },
                ]}
              />
            }
            language="css"
            value={css}
            collapsed={cssCollapsed}
            onToggle={() => setCssCollapsed((c) => !c)}
            onChange={setCss}
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
            <span className="hidden sm:block">{user ? "Click any text to edit" : "Sign in to edit"}</span>
            <span className="flex shrink-0 items-center gap-[6px]">
              <Image src={liveDot} alt="" width={6} height={6} />
              Live
            </span>
          </div>
          {/* Sandboxed without allow-same-origin: only our injected scripts run, isolated from the app. */}
          <iframe
            key={renderKey}
            ref={frame}
            title="Preview"
            sandbox="allow-scripts"
            srcDoc={frameDoc}
            className="min-h-0 flex-1 bg-white"
          />
        </section>
      </main>
      {editing && session?.user && (
        <TableEditor
          key={view}
          csv={csv}
          title={editLabel}
          onApply={(nextCsv) => {
            setCsv(nextCsv);
            setEditing(false);
          }}
          onClose={() => setEditing(false)}
        />
      )}
      {saveToast && (
        <div
          role={saveToast.kind === "error" ? "alert" : "status"}
          aria-live={saveToast.kind === "error" ? "assertive" : "polite"}
          className={`fixed bottom-[20px] right-[20px] z-[60] max-w-[min(420px,calc(100vw-40px))] rounded-[10px] border px-[16px] py-[12px] text-[14px] font-medium shadow-lg ${
            saveToast.kind === "success"
              ? "border-[#b7e4ca] bg-[#effaf3] text-[#176b3a]"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {saveToast.message}
        </div>
      )}
    </div>
  );
}