"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import liveDot from "@/assets/icons/live-dot.svg";
import Button, { buttonClass } from "@/components/Button";
import EditorPane from "@/components/EditorPane";
import ExportMenu from "@/components/ExportMenu";
import { SaveIcon, UploadIcon } from "@/components/Icons";
import Logo from "@/components/Logo";
import PhotoButton from "@/components/PhotoButton";
import ResizeHandle from "@/components/ResizeHandle";
import Select from "@/components/Select";
import ViewSwitch, { type View } from "@/components/ViewSwitch";
import AuthButton from "@/components/AuthButton";
import SaveStatus, { type SaveState } from "@/components/SaveStatus";
import Dashboard from "@/components/Dashboard";
import { useUser } from "@/app/hooks/useUser";
import { AUTH_ENABLED, DEFAULT_VIEW, isViewEnabled } from "@/lib/features";
import { DEFAULT_CSV } from "@/lib/table/defaults";
import { fileToPhoto } from "@/lib/resume/photo";
import { buildDocument } from "@/lib/table/preview";
import { buildResumeDocument } from "@/lib/resume";
import { parseCsv } from "@/lib/csv-parser";
import { importCandidateResumes } from "@/lib/resume/import-csv";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  persist,
  restore,
  savePhoto,
  saveSidebar,
  VIEWS,
  type Work,
} from "@/lib/storage";
import {
  isRetryableSaveFailure,
  ProjectConflictError,
  getProject,
  listProjects,
  renameProject,
  saveProject,
  syncProject,
  type CloudProject,
} from "@/lib/cloud";
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
const PULL_INTERVAL_MS = 30_000;

type ConflictSave = {
  view: View;
  csv: string;
  css: string;
  themeId: string | null;
  photo: string;
  expectedUpdatedAt: string;
};

/** Removes every vizify:* key so the next person on this browser starts clean. */
function clearLocal() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("vizify:"))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // storage blocked
  }
}

export default function Playground({
  themes,
  resumeThemes,
  projectId,
}: {
  themes: Theme[];
  resumeThemes: ThemeOption[];
  projectId?: string;
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
  const [status, setStatus] = useState<SaveState>("idle");
  const [retryableFailure, setRetryableFailure] = useState(false);
  const [projectLoadError, setProjectLoadError] = useState("");
  const [projectName, setProjectName] = useState("Untitled project");
  const [nameDraft, setNameDraft] = useState("Untitled project");
  const [renaming, setRenaming] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [dataCollapsed, setDataCollapsed] = useState(false);
  const [cssCollapsed, setCssCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const [projectManagerOpen, setProjectManagerOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedProjectId = projectId ?? searchParams.get("p");
  const fileInput = useRef<HTMLInputElement>(null);
  const { user, loading: userLoading } = useUser();
  const userId = user?.id ?? null;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const [cloudReady, setCloudReady] = useState(false);
  const projectIds = useRef<Partial<Record<View, string>>>({});
  const dirty = useRef<Partial<Record<View, boolean>>>({});
  const etags = useRef<Partial<Record<View, string | null>>>({});
  const updatedAts = useRef<Partial<Record<View, string>>>({});
  const revisions = useRef<Partial<Record<View, number>>>({});
  const photoDirty = useRef(false);
  const dataRef = useRef(data);
  const photoRef = useRef(photo);
  const viewRef = useRef(view);
  const themeIdRef = useRef<string | null>(null);
  const projectNameRef = useRef(projectName);
  const nameDraftRef = useRef(nameDraft);
  projectNameRef.current = projectName;
  nameDraftRef.current = nameDraft;
  const savePromise = useRef<Promise<boolean> | null>(null);
  const nameSavePromise = useRef<Promise<boolean> | null>(null);
  const flushPendingSaveRef = useRef<() => Promise<boolean>>(async () => false);
  const conflictSaveRef = useRef<ConflictSave | null>(null);
  const conflictNameRef = useRef<string | null>(null);
  const retryTimersRef = useRef<number[]>([]);
  const retryAttemptRef = useRef(0);

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
  themeIdRef.current = themeId ?? null;
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

    setData((current) => {
      const restored: Work = {
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
      };
      dataRef.current = restored;
      return restored;
    });

    // Only restore a saved view that is currently available.
    if (saved.view && isViewEnabled(saved.view)) {
      viewRef.current = saved.view;
      setView(saved.view);
    }
    if (
      saved.work.table ||
      saved.work.resume ||
      saved.work.idcard ||
      saved.work.board ||
      saved.work.cards ||
      saved.work.certificates
    )
      setStatus("saved");
    if (saved.sidebar) setSidebarWidth(saved.sidebar);
    photoRef.current = saved.photo;
    if (saved.photo) setPhoto(saved.photo);
    setLoaded(true);
  }, []);

  // Guests: autosave to localStorage shortly after the user stops typing.
  useEffect(() => {
    if (!loaded || (AUTH_ENABLED && userId) || requestedProjectId) return;
    const t = setTimeout(
      () => setStatus(persist(view, csv, css) ? "saved" : "idle"),
      AUTOSAVE_MS,
    );

    return () => clearTimeout(t);
  }, [view, csv, css, loaded, userId, requestedProjectId]);

  // Signed in: load the user's latest project for each view.
  useEffect(() => {
    if (!AUTH_ENABLED || !userId) return;
    let cancelled = false;
    let projectLoadFailed = false;

    (async () => {
      try {
        if (requestedProjectId) {
          const project = await getProject(requestedProjectId);
          if (cancelled) return;
          if (!isViewEnabled(project.view)) {
            throw new Error("This project uses a view that is currently unavailable.");
          }
          projectIds.current[project.view] = project.id;
          dirty.current[project.view] = false;
          etags.current[project.view] = project.etag ?? null;
          if (project.updatedAt) updatedAts.current[project.view] = project.updatedAt;
          setData((previous) => {
            const next = {
              ...previous,
              [project.view]: {
                csv: project.csv ?? previous[project.view].csv,
                css: project.css ?? previous[project.view].css,
              },
            };
            dataRef.current = next;
            return next;
          });
          setProjectName(project.name);
          setNameDraft(project.name);
          photoDirty.current = false;
          photoRef.current = project.photo ?? "";
          setPhoto(project.photo ?? "");
          setCandidateIndex(0);
          viewRef.current = project.view;
          setView(project.view);
          setStatus("saved");
        } else {
          const list = await listProjects();
          const latest = new Map<View, CloudProject>();
          for (const project of list) {
            if (VIEWS.includes(project.view) && !latest.has(project.view)) {
              latest.set(project.view, project);
            }
          }

          const full = await Promise.all(
            [...latest.values()].map((project) => getProject(project.id)),
          );
          if (cancelled) return;

          for (const project of full) {
            projectIds.current[project.view] = project.id;
            if (project.updatedAt) updatedAts.current[project.view] = project.updatedAt;
            etags.current[project.view] = project.etag ?? null;
          }
          setData((previous) => {
            const next = { ...previous };
            for (const project of full) {
              next[project.view] = {
                csv: project.csv ?? previous[project.view].csv,
                css: project.css ?? previous[project.view].css,
              };
            }
            dataRef.current = next;
            return next;
          });
          const resumeProject = full.find((project) => project.view === "resume");
          photoDirty.current = false;
          photoRef.current = resumeProject?.photo ?? "";
          setPhoto(resumeProject?.photo ?? "");
        }
      } catch (error) {
        if (requestedProjectId && !cancelled) {
          projectLoadFailed = true;
          setProjectLoadError(
            error instanceof Error
              ? error.message
              : "Could not open this project. It may have been deleted or you may no longer have access.",
          );
        }
      } finally {
        if (!cancelled && !projectLoadFailed) setCloudReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, requestedProjectId]);

  function applyRemoteProject(project: CloudProject) {
    const viewKey = project.view;
    dirty.current[viewKey] = false;
    if (project.updatedAt) updatedAts.current[viewKey] = project.updatedAt;
    etags.current[viewKey] = project.etag ?? null;
    setData((d) => {
      const next = {
        ...d,
        [viewKey]: {
          csv: project.csv ?? d[viewKey].csv,
          css: project.css ?? d[viewKey].css,
        },
      };
      dataRef.current = next;
      return next;
    });
    if (viewKey === "resume") {
      photoDirty.current = false;
      photoRef.current = project.photo ?? "";
      setPhoto(project.photo ?? "");
    }
  }

  function scheduleSaveRetry() {
    if (!navigator.onLine) return;
    const delays = [2000, 5000, 15000];
    const attempt = retryAttemptRef.current;
    if (attempt >= delays.length) return;
    retryAttemptRef.current += 1;
    const timer = window.setTimeout(() => {
      retryTimersRef.current = retryTimersRef.current.filter((value) => value !== timer);
      void retrySave();
    }, delays[attempt]);
    retryTimersRef.current.push(timer);
  }

  async function cloudSave(
    viewToSave: View,
    csvToSave: string,
    cssToSave: string,
    themeIdToSave: string | null,
    photoToSave = photoRef.current,
  ): Promise<boolean> {
    if (savePromise.current) {
      const activeSave = savePromise.current;
      const completed = await activeSave;
      if (!completed) return false;
      if (savePromise.current === activeSave) savePromise.current = null;
      if (dirty.current[viewToSave]) {
        const latest = dataRef.current[viewToSave];
        return cloudSave(
          viewToSave,
          latest.csv,
          latest.css,
          themeIdToSave,
          photoRef.current,
        );
      }
      return true;
    }

    const revision = revisions.current[viewToSave] ?? 0;
    const save = (async () => {
      setStatus("saving");
      setRetryableFailure(false);
      try {
        let id = projectIds.current[viewToSave];
        let updatedAt = updatedAts.current[viewToSave];
        const isNewProject = !id;
        if (!id) {
          const created = await saveProject(
            undefined,
            viewToSave,
            csvToSave,
            cssToSave,
            themeIdToSave,
          );
          id = created.id;
          projectIds.current[viewToSave] = id;
          updatedAt = created.updatedAt;
          if (updatedAt) updatedAts.current[viewToSave] = updatedAt;
        }

        if (!updatedAt) {
          throw new Error("The project version is unavailable. Reload and try again.");
        }
        const photoToPersist =
          viewToSave === "resume" &&
          (photoDirty.current || (isNewProject && photoToSave !== ""))
            ? photoToSave
            : undefined;

        let saved: CloudProject;
        try {
          saved = await saveProject(
            id,
            viewToSave,
            csvToSave,
            cssToSave,
            themeIdToSave,
            updatedAt,
            photoToPersist,
          );
        } catch (error) {
          if (error instanceof ProjectConflictError && error.updatedAt) {
            conflictSaveRef.current = {
              view: viewToSave,
              csv: csvToSave,
              css: cssToSave,
              themeId: themeIdToSave,
              photo: photoToPersist ?? photoToSave,
              expectedUpdatedAt: error.updatedAt,
            };
            setStatus("conflict");
            setConflictOpen(true);
            throw new Error("The resume changed elsewhere.");
          }
          throw error;
        }

        if (saved.updatedAt) updatedAts.current[viewToSave] = saved.updatedAt;
        if (saved.etag !== undefined) etags.current[viewToSave] = saved.etag;
        const unchanged = (revisions.current[viewToSave] ?? 0) === revision;
        dirty.current[viewToSave] = !unchanged;
        if (photoToPersist !== undefined && photoRef.current === photoToPersist) {
          photoDirty.current = false;
        }
        conflictSaveRef.current = null;
        retryAttemptRef.current = 0;
        retryTimersRef.current.forEach((timer) => window.clearTimeout(timer));
        retryTimersRef.current = [];
        setRetryableFailure(false);
        setStatus(unchanged ? "saved" : "idle");
        return true;
      } catch (error) {
        persist(viewToSave, csvToSave, cssToSave);
        if (viewToSave === "resume") savePhoto(photoToSave);
        console.error("Resume save failed", error);

        if (conflictSaveRef.current || error instanceof ProjectConflictError) {
          setRetryableFailure(false);
          setStatus("conflict");
        } else if (!navigator.onLine) {
          setRetryableFailure(false);
          setStatus("offline");
        } else if (isRetryableSaveFailure(error)) {
          setStatus("failed");
          setRetryableFailure(true);
          scheduleSaveRetry();
        } else {
          setStatus("failed");
          setRetryableFailure(false);
        }
        return false;
      }
    })();

    savePromise.current = save;
    try {
      return await save;
    } finally {
      if (savePromise.current === save) savePromise.current = null;
    }
  }

  async function saveProjectName(): Promise<boolean> {
    if (nameSavePromise.current) return nameSavePromise.current;
    const name = nameDraft.trim();
    const id = requestedProjectId ?? projectIds.current[view];
    if (!name || name.length > 100) {
      setRetryableFailure(false);
      setStatus("failed");
      return false;
    }
    if (name === projectName) return true;
    if (!id) {
      setRetryableFailure(false);
      setStatus("failed");
      return false;
    }

    const saveName = (async () => {
      setRenaming(true);
      setStatus("saving");
      setRetryableFailure(false);
      try {
        let updated: CloudProject;
        try {
          const expected = updatedAts.current[view];
          if (!expected) throw new Error("The project version is unavailable. Reload and try again.");
          updated = await renameProject(id, name, expected);
        } catch (error) {
          if (!(error instanceof ProjectConflictError) || !error.updatedAt) throw error;
          conflictNameRef.current = name;
          setStatus("conflict");
          setConflictOpen(true);
          throw new Error("The resume changed elsewhere.");
        }
        setProjectName(updated.name);
        setNameDraft(updated.name);
        if (updated.updatedAt) updatedAts.current[view] = updated.updatedAt;
        setStatus(dirty.current[view] ? "idle" : "saved");
        return true;
      } catch (error) {
        console.error("Resume rename failed", error);
        if (!conflictNameRef.current) {
          const retryable = isRetryableSaveFailure(error);
          setRetryableFailure(retryable);
          setStatus("failed");
          if (retryable) scheduleSaveRetry();
        }
        return false;
      } finally {
        setRenaming(false);
      }
    })();

    nameSavePromise.current = saveName;
    try {
      return await saveName;
    } finally {
      if (nameSavePromise.current === saveName) nameSavePromise.current = null;
    }
  }

  async function flushPendingSave(): Promise<boolean> {
    const activeSave = savePromise.current;
    if (activeSave && !(await activeSave)) return false;
    if (nameDraft.trim() !== projectName && !(await saveProjectName())) return false;
    if (!dirty.current[view]) return true;
    const latest = dataRef.current[view];
    return cloudSave(view, latest.csv, latest.css, themeIdRef.current, photoRef.current);
  }

  flushPendingSaveRef.current = flushPendingSave;

  async function leaveEditor(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (await flushPendingSave()) router.push("/dashboard");
  }

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    return () => {
      const viewToSave = viewRef.current;
      if (!AUTH_ENABLED || !userIdRef.current) return;
      if (
        dirty.current[viewToSave] ||
        nameDraftRef.current.trim() !== projectNameRef.current
      ) {
        void flushPendingSaveRef.current();
      }
    };
  }, []);

  // Autosave cloud projects after the user edits and cloud data is loaded.
  useEffect(() => {
    if (!AUTH_ENABLED || !userId || !cloudReady || !dirty.current[view]) return;
    const timeout = setTimeout(
      () => void cloudSave(view, csv, css, themeId ?? null, photoRef.current),
      AUTOSAVE_MS,
    );
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, cloudReady, view, csv, css, photo, themeId]);

  // Pull S3 changes when the tab regains focus and every 30 s (skipped while there are unsaved edits).
  useEffect(() => {
    if (!AUTH_ENABLED || !userId || !cloudReady || projectId) return;
    const pull = async () => {
      const id = projectIds.current[view];
      if (!id || dirty.current[view]) return;
      const revision = revisions.current[view] ?? 0;
      try {
        const res = await syncProject(id, undefined, etags.current[view] ?? null);
        if (dirty.current[view] || (revisions.current[view] ?? 0) !== revision) return;
        if (res.status === "pulled") {
          const project = await getProject(id);
          if (dirty.current[view] || (revisions.current[view] ?? 0) !== revision) return;
          applyRemoteProject(project);
        } else {
          if (res.etag) etags.current[view] = res.etag;
          if (res.updatedAt) updatedAts.current[view] = res.updatedAt;
        }
      } catch {
        // offline or S3 hiccup: try again next time
      }
    };
    window.addEventListener("focus", pull);
    const timer = setInterval(pull, PULL_INTERVAL_MS);
    return () => {
      window.removeEventListener("focus", pull);
      clearInterval(timer);
    };
  }, [userId, cloudReady, view, projectId]);

  function handleSignOut() {
    clearLocal();
    projectIds.current = {};
    dirty.current = {};
    etags.current = {};
    updatedAts.current = {};
    revisions.current = {};
    setProjectManagerOpen(false);
    setCloudReady(false);
    photoDirty.current = false;
    photoRef.current = "";
    setPhoto("");
    const reset: Work = {
      table: { csv: DEFAULT_CSV, css: themes[0]?.css ?? "" },
      resume: { csv: DEFAULT_RESUME_CSV, css: resumeThemes[0]?.css ?? "" },
      idcard: { csv: DEFAULT_ID_CARD_CSV, css: ID_CARD_THEMES[0]?.css ?? "" },
      board: { csv: BOARD_CSV, css: boardThemeOptions[0]?.css ?? "" },
      cards: { csv: CARDS_CSV, css: cardsThemeOptions[0]?.css ?? "" },
      certificates: { csv: CERTIFICATES_CSV, css: certificatesThemeOptions[0]?.css ?? "" },
    };
    dataRef.current = reset;
    setData(reset);
    setStatus("idle");
  }

  function resizeSidebar(width: number) {
    const max = Math.max(SIDEBAR_MIN, window.innerWidth - PREVIEW_MIN);
    const next = Math.round(Math.min(Math.max(width, SIDEBAR_MIN), max));
    setSidebarWidth(next);
    saveSidebar(next);
  }

  function update(field: "csv" | "css") {
    return (v: string) => {
      dirty.current[view] = true;
      revisions.current[view] = (revisions.current[view] ?? 0) + 1;
      setStatus("idle");
      const next = {
        ...dataRef.current,
        [view]: { ...dataRef.current[view], [field]: v },
      };
      dataRef.current = next;
      setData(next);
    };
  }

  const setCsv = update("csv");
  const setCss = update("css");
  const onCsvChange = setCsv;
  const onCssChange = setCss;

  function changeView(nextView: View) {
    const previousView = viewRef.current;
    if (previousView !== nextView && dirty.current[previousView] && userId) {
      const pending = dataRef.current[previousView];
      void cloudSave(
        previousView,
        pending.csv,
        pending.css,
        themeIdRef.current,
        photoRef.current,
      );
    }
    viewRef.current = nextView;
    setView(nextView);
  }

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
      photoRef.current = url;
      photoDirty.current = true;
      dirty.current[view] = true;
      revisions.current[view] = (revisions.current[view] ?? 0) + 1;
      setPhoto(url);
      const saved = userId ? true : savePhoto(url);
      setRetryableFailure(!saved && !userId);
      setStatus(userId ? "idle" : saved ? "saved" : "failed");
    } catch {
      setRetryableFailure(false);
      setStatus("failed");
    }
  }

  function onRemovePhoto() {
    photoRef.current = "";
    photoDirty.current = true;
    dirty.current[view] = true;
    revisions.current[view] = (revisions.current[view] ?? 0) + 1;
    setPhoto("");
    const saved = userId ? true : savePhoto("");
    setRetryableFailure(!saved && !userId);
    setStatus(userId ? "idle" : saved ? "saved" : "failed");
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

  async function retrySave() {
    if (status === "conflict") {
      setConflictOpen(true);
      return;
    }
    if (conflictSaveRef.current) {
      await overwriteConflict();
      return;
    }
    if (nameDraft.trim() !== projectName) {
      if (!(await saveProjectName())) return;
      if (dirty.current[view]) {
        await cloudSave(view, dataRef.current[view].csv, dataRef.current[view].css, themeIdRef.current, photoRef.current);
      }
      return;
    }
    if (userId) {
      await cloudSave(view, csv, css, themeId ?? null, photoRef.current);
      return;
    }
    const saved = persist(view, csv, css) && (view !== "resume" || savePhoto(photo));
    setRetryableFailure(!saved);
    setStatus(saved ? "saved" : "failed");
  }

  async function overwriteConflict() {
    const conflict = conflictSaveRef.current;
    const conflictName = conflictNameRef.current;
    setConflictOpen(false);
    try {
      if (conflict) {
        const id = projectIds.current[conflict.view];
        if (!id) throw new Error("The project is unavailable.");
        const saved = await saveProject(
          id,
          conflict.view,
          conflict.csv,
          conflict.css,
          conflict.themeId,
          conflict.expectedUpdatedAt,
          conflict.photo,
          true,
        );
        if (saved.updatedAt) updatedAts.current[conflict.view] = saved.updatedAt;
        conflictSaveRef.current = null;
        setStatus("saved");
      } else if (conflictName) {
        const id = requestedProjectId ?? projectIds.current[view];
        if (!id) throw new Error("The project is unavailable.");
        const latest = await getProject(id);
        if (!latest.updatedAt) throw new Error("The latest project version is unavailable.");
        const updated = await renameProject(id, conflictName, latest.updatedAt);
        setProjectName(updated.name);
        setNameDraft(updated.name);
        if (updated.updatedAt) updatedAts.current[view] = updated.updatedAt;
        conflictNameRef.current = null;
        setStatus("saved");
      }
    } catch (error) {
      console.error("Resume conflict resolution failed", error);
      const retryable = isRetryableSaveFailure(error);
      setRetryableFailure(retryable);
      setStatus("failed");
      if (retryable) scheduleSaveRetry();
    }
  }

  async function reloadConflict() {
    const id = requestedProjectId ?? projectIds.current[view];
    setConflictOpen(false);
    if (!id) return;
    try {
      const latest = await getProject(id);
      applyRemoteProject(latest);
      setProjectName(latest.name);
      setNameDraft(latest.name);
      conflictSaveRef.current = null;
      conflictNameRef.current = null;
      setStatus("saved");
    } catch (error) {
      console.error("Resume reload failed", error);
      setStatus("offline");
    }
  }

  if (projectId && AUTH_ENABLED && userLoading) {
    return <main className="grid min-h-screen place-items-center text-ink3">Loading account…</main>;
  }
  if (projectId && AUTH_ENABLED && !user) {
    const next = `/editor/${encodeURIComponent(projectId)}`;
    return (
      <main className="grid min-h-screen place-items-center bg-sunken p-[24px]">
        <section className="w-full max-w-[440px] rounded-[16px] border border-line bg-surface p-[32px] text-center shadow-sm">
          <h1 className="text-[24px] font-bold text-ink">Sign in to edit this resume</h1>
          <Link
            href={`/sign-in?next=${encodeURIComponent(next)}`}
            className={`${buttonClass("primary")} mt-[24px]`}
          >
            Sign in
          </Link>
        </section>
      </main>
    );
  }
  if (projectId && projectLoadError) {
    return (
      <main className="grid min-h-screen place-items-center bg-sunken p-[24px]">
        <section className="w-full max-w-[520px] rounded-[16px] border border-line bg-surface p-[32px] text-center shadow-sm">
          <h1 className="text-[24px] font-bold text-ink">Could not open this resume</h1>
          <p role="alert" className="mt-[12px] text-[14px] text-red-700">{projectLoadError}</p>
          <Link href="/dashboard" className={`${buttonClass("primary")} mt-[24px]`}>
            Back to My Resumes
          </Link>
        </section>
      </main>
    );
  }
  if (projectId && !cloudReady) {
    return <main className="grid min-h-screen place-items-center text-ink3">Loading resume…</main>;
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-sunken">
      <header className="flex min-h-[56px] shrink-0 flex-wrap items-center gap-[8px] border-b border-line bg-surface px-[10px] py-[8px] sm:px-[16px] lg:h-[56px] lg:flex-nowrap lg:gap-[12px]">
        <Logo />

        {projectId && (
          <>
            <Link
              href="/dashboard"
              onClick={(event) => void leaveEditor(event)}
              className="shrink-0 text-[12px] font-semibold text-accent-light hover:underline"
            >
              Back to My Resumes
            </Link>
            <input
              aria-label="Resume title"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              onBlur={() => void saveProjectName()}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
                if (event.key === "Escape") {
                  setNameDraft(projectName);
                  event.currentTarget.blur();
                }
              }}
              disabled={!cloudReady || renaming}
              maxLength={100}
              className="min-w-[120px] max-w-[220px] border-b border-transparent bg-transparent px-[4px] text-[14px] font-semibold text-ink outline-none focus:border-accent-light"
            />
            <SaveStatus
              state={status}
              retryable={retryableFailure}
              onRetry={() => status === "conflict" ? setConflictOpen(true) : void retrySave()}
            />
          </>
        )}

        <ViewSwitch value={view} onChange={changeView} />

        {AUTH_ENABLED && (
          <Button variant="ghost" onClick={() => setProjectManagerOpen(true)}>
            Projects
          </Button>
        )}

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
        {AUTH_ENABLED && !userId && (
          <Button
            onClick={() => {
              const saved = persist(view, csv, css);
              setRetryableFailure(!saved);
              setStatus(saved ? "saved" : "failed");
            }}
          >
            <SaveIcon />
            Save
          </Button>
        )}
        {!projectId && (
          <SaveStatus
            state={status}
            retryable={retryableFailure}
            onRetry={() => status === "conflict" ? setConflictOpen(true) : void retrySave()}
          />
        )}
        <ExportMenu view={view} html={doc} csv={csv} staticHtml={staticDoc()} />
        {AUTH_ENABLED &&
          (user ? (
            <AuthButton user={user} onSignOut={handleSignOut} />
          ) : (
            <Link href="/sign-in?next=%2F" className={buttonClass("ghost")}>
              Sign in
            </Link>
          ))}
      </header>

      <Dialog open={conflictOpen} onClose={() => setConflictOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-[16px]">
          <DialogPanel className="w-full max-w-[420px] rounded-[12px] bg-surface p-[24px] shadow-xl">
            <DialogTitle className="text-[18px] font-semibold text-ink">
              This resume changed elsewhere
            </DialogTitle>
            <p className="mt-[8px] text-[14px] text-ink3">
              Review the latest version or keep your current edits.
            </p>
            <div className="mt-[20px] flex justify-end gap-[8px]">
              <Button variant="ghost" onClick={() => void reloadConflict()}>
                Load latest
              </Button>
              <Button onClick={() => void overwriteConflict()}>
                Keep my edits
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

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
      {projectManagerOpen && (
        <Dashboard
          mode="panel"
          defaultResumeCsv={DEFAULT_RESUME_CSV}
          defaultResumeCss={
            resumeThemes.find((resumeTheme) => resumeTheme.id === "resume-classic")?.css ??
            resumeThemes[0]?.css ??
            ""
          }
          defaultResumeThemeId={
            resumeThemes.find((resumeTheme) => resumeTheme.id === "resume-classic")?.id ??
            resumeThemes[0]?.id ??
            null
          }
          onClose={() => setProjectManagerOpen(false)}
          onOpenProject={(id) => {
            setProjectManagerOpen(false);
            router.push(`/editor/${encodeURIComponent(id)}`);
          }}
        />
      )}
    </div>
  );
}