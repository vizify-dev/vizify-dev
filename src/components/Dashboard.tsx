"use client";

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AuthButton from "@/components/AuthButton";
import Button, { buttonClass } from "@/components/Button";
import Logo from "@/components/Logo";
import { useUser } from "@/app/hooks/useUser";
import {
  deleteProject,
  duplicateProject,
  listProjects,
  renameProject,
  saveProject,
  type CloudProject,
} from "@/lib/cloud";
import type { View } from "@/components/ViewSwitch";

type Props = {
  defaultResumeCsv: string;
  defaultResumeCss: string;
  defaultResumeThemeId: string | null;
  mode?: "page" | "panel";
  onClose?: () => void;
  onOpenProject?: (id: string) => void;
};

type SortOrder = "updated" | "name";

const viewNames: Record<View, string> = {
  table: "Table",
  resume: "Resume",
  idcard: "ID Card",
  board: "Jira Board",
  cards: "ID Cards",
  certificates: "Certificates",
};

const MENU_ITEM =
  "block w-full cursor-pointer rounded-[7px] px-[12px] py-[8px] text-left text-[13px] text-ink data-focus:bg-sunken";

export default function Dashboard({
  defaultResumeCsv,
  defaultResumeCss,
  defaultResumeThemeId,
  mode = "page",
  onClose,
  onOpenProject,
}: Props) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [projects, setProjects] = useState<CloudProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("updated");
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (userLoading || !user) return;
    let active = true;

    listProjects()
      .then((result) => {
        if (active) {
          setProjects(result);
          setLoadError("");
        }
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : "Could not load projects.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, userLoading, refreshKey]);

  const visibleProjects = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return projects
      .filter(
        (project) =>
          !term ||
          project.name.toLocaleLowerCase().includes(term) ||
          viewNames[project.view].toLocaleLowerCase().includes(term),
      )
      .sort((a, b) =>
        sortOrder === "name"
          ? a.name.localeCompare(b.name)
          : Date.parse(b.updatedAt ?? "") - Date.parse(a.updatedAt ?? ""),
      );
  }, [projects, search, sortOrder]);

  function withPanel(content: React.ReactNode) {
    if (mode !== "panel") return content;
    return (
      <Dialog open onClose={() => onClose?.()} className="relative z-50">
        <div className="fixed inset-0 bg-black/35" aria-hidden="true" />
        <div className="fixed inset-0 flex justify-end">
          <DialogPanel className="h-full w-full max-w-[960px] overflow-y-auto bg-sunken shadow-2xl">
            <DialogTitle className="sr-only">Project manager</DialogTitle>
            {content}
          </DialogPanel>
        </div>
      </Dialog>
    );
  }

  async function createResume() {
    setBusy(true);
    setActionError("");
    try {
      const project = await saveProject(
        undefined,
        "resume",
        defaultResumeCsv,
        defaultResumeCss,
        defaultResumeThemeId,
      );
      openProject(project);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not create a resume.");
    } finally {
      setBusy(false);
    }
  }

  function openProject(project: CloudProject) {
    if (onOpenProject) onOpenProject(project.id);
    else router.push(`/?p=${encodeURIComponent(project.id)}`);
  }

  async function rename(project: CloudProject) {
    const name = window.prompt("Enter a new project name", project.name)?.trim();
    if (!name || name === project.name) return;
    if (name.length > 100) {
      setActionError("Project names must be 100 characters or fewer.");
      return;
    }

    setBusy(true);
    setActionError("");
    try {
      const updated = await renameProject(project.id, name);
      setProjects((current) =>
        current.map((item) =>
          item.id === project.id ? { ...item, name: updated.name } : item,
        ),
      );
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not rename project.");
    } finally {
      setBusy(false);
    }
  }

  async function duplicate(project: CloudProject) {
    setBusy(true);
    setActionError("");
    try {
      const copy = await duplicateProject(project.id);
      setProjects((current) => [copy, ...current]);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not duplicate project.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(project: CloudProject) {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    setBusy(true);
    setActionError("");
    try {
      await deleteProject(project.id);
      setProjects((current) => current.filter((item) => item.id !== project.id));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not delete project.");
    } finally {
      setBusy(false);
    }
  }

  if (userLoading) {
    return withPanel(<main className="grid min-h-screen place-items-center text-ink3">Loading account…</main>);
  }

  if (!user) {
    return withPanel(
      <main className="grid min-h-screen place-items-center bg-sunken p-[24px]">
        <section className="w-full max-w-[440px] rounded-[16px] border border-line bg-surface p-[32px] text-center shadow-sm">
          <div className="flex justify-center"><Logo /></div>
          <h1 className="mt-[24px] text-[24px] font-bold text-ink">Sign in to view your projects</h1>
          <p className="mt-[8px] text-[14px] text-ink3">Your saved projects are linked to your account.</p>
          <Link href="/sign-in" className={`${buttonClass("primary")} mt-[24px]`}>
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  return withPanel(
    <main className={`${mode === "panel" ? "min-h-full" : "min-h-screen"} bg-sunken`}>
      <header className="flex min-h-[64px] items-center justify-between border-b border-line bg-surface px-[20px] sm:px-[40px]">
        <Logo />
        <div className="flex items-center gap-[12px]">
          {mode === "panel" ? (
            <Button variant="ghost" aria-label="Close project manager" onClick={onClose}>
              Close
            </Button>
          ) : (
            <>
              <Link href="/" className={buttonClass("ghost")}>Editor</Link>
              <AuthButton user={user} onSignOut={() => router.refresh()} />
            </>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-[1200px] px-[20px] py-[40px] sm:px-[40px] sm:py-[56px]">
        <div className="flex flex-col justify-between gap-[20px] sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[11px] tracking-[0.12em] text-accent-light">YOUR WORKSPACE</p>
            <h1 className="mt-[8px] text-[32px] font-bold tracking-[-0.03em] text-ink sm:text-[40px]">
              Your projects
            </h1>
            <p className="mt-[8px] text-[15px] text-ink3">Pick up where you left off, or start something new.</p>
          </div>
          <Button variant="primary" disabled={busy} onClick={() => void createResume()}>
            {busy ? "Working…" : "+ New resume"}
          </Button>
        </div>

        {actionError && (
          <p role="alert" className="mt-[20px] rounded-[8px] border border-red-200 bg-red-50 px-[14px] py-[10px] text-[14px] text-red-700">
            {actionError}
          </p>
        )}

        <div className="mt-[32px] flex flex-col gap-[10px] sm:flex-row">
          <label className="flex h-[42px] flex-1 items-center rounded-[8px] border border-line bg-surface px-[12px]">
            <span className="sr-only">Search projects</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects…"
              className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink3"
            />
          </label>
          <label className="flex h-[42px] items-center gap-[8px] rounded-[8px] border border-line bg-surface px-[12px] text-[13px] text-ink3">
            Sort
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as SortOrder)}
              className="cursor-pointer bg-transparent font-semibold text-ink outline-none"
            >
              <option value="updated">Recently updated</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="mt-[32px] grid gap-[16px] sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading projects">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-[240px] animate-pulse rounded-[12px] border border-line bg-surface" />
            ))}
          </div>
        ) : loadError ? (
          <div className="mt-[32px] rounded-[12px] border border-line bg-surface p-[28px] text-center">
            <p role="alert" className="text-[14px] text-red-700">{loadError}</p>
            <Button className="mt-[16px]" onClick={() => { setLoading(true); setRefreshKey((key) => key + 1); }}>
              Try again
            </Button>
          </div>
        ) : visibleProjects.length === 0 ? (
          <div className="mt-[32px] rounded-[12px] border border-line bg-surface px-[24px] py-[56px] text-center">
            <div className="mx-auto grid size-[52px] place-items-center rounded-[14px] bg-sunken text-[24px]" aria-hidden="true">✦</div>
            <h2 className="mt-[16px] text-[20px] font-bold text-ink">
              {projects.length === 0 ? "Your next great thing starts here" : "No projects match your search"}
            </h2>
            <p className="mx-auto mt-[8px] max-w-[420px] text-[14px] leading-6 text-ink3">
              {projects.length === 0
                ? "Create a resume project and make your experience shine."
                : "Try another name or clear the search to see all your projects."}
            </p>
            {projects.length === 0 && (
              <Button variant="primary" disabled={busy} className="mt-[20px]" onClick={() => void createResume()}>
                + New resume
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-[20px] grid gap-[16px] sm:grid-cols-2 lg:grid-cols-3">
            {visibleProjects.map((project) => (
              <article
                key={project.id}
                className="group overflow-hidden rounded-[12px] border border-line bg-surface transition-shadow hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => openProject(project)}
                  disabled={busy}
                  className="block w-full cursor-pointer p-[16px] text-left disabled:cursor-wait"
                >
                  <div className="relative flex h-[140px] flex-col overflow-hidden rounded-[8px] bg-sunken p-[18px]">
                    <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-accent-light">
                      {viewNames[project.view].toUpperCase()}
                    </span>
                    <span className="mt-[14px] h-[8px] w-[56%] rounded-full bg-ink/70" />
                    <span className="mt-[8px] h-[5px] w-[78%] rounded-full bg-ink/20" />
                    <span className="mt-[5px] h-[5px] w-[68%] rounded-full bg-ink/20" />
                    <span className="mt-[14px] h-[5px] w-[86%] rounded-full bg-ink/15" />
                    <span className="mt-[5px] h-[5px] w-[72%] rounded-full bg-ink/15" />
                    <span className="mt-[5px] h-[5px] w-[80%] rounded-full bg-ink/15" />
                  </div>
                  <div className="mt-[14px] flex items-start justify-between gap-[10px]">
                    <div className="min-w-0">
                      <h2 className="truncate text-[16px] font-semibold text-ink">{project.name}</h2>
                      <p className="mt-[4px] text-[12px] text-ink3">
                        {project.updatedAt
                          ? `Updated ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(project.updatedAt))}`
                          : viewNames[project.view]}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-sunken px-[8px] py-[4px] font-mono text-[10px] text-ink3">
                      {viewNames[project.view]}
                    </span>
                  </div>
                </button>

                <div className="flex items-center justify-between border-t border-line px-[16px] py-[10px]">
                  <button
                    type="button"
                    onClick={() => openProject(project)}
                    disabled={busy}
                    className="cursor-pointer text-[13px] font-semibold text-[#007e9f] hover:underline disabled:opacity-50"
                  >
                    Open project
                  </button>
                  <Menu>
                    <MenuButton
                      type="button"
                      aria-label={`Actions for ${project.name}`}
                      disabled={busy}
                      className="grid size-[34px] cursor-pointer place-items-center rounded-[7px] text-[22px] leading-none text-ink3 hover:bg-sunken focus-visible:outline-2 focus-visible:outline-accent-light disabled:opacity-50"
                    >
                      ⋯
                    </MenuButton>
                    <MenuItems
                      anchor="bottom end"
                      transition
                      className="z-50 min-w-[150px] rounded-[9px] border border-line bg-surface p-[5px] shadow-lg [--anchor-gap:5px] focus:outline-none"
                    >
                      <MenuItem>
                        <button type="button" className={MENU_ITEM} onClick={() => openProject(project)}>Open</button>
                      </MenuItem>
                      <MenuItem>
                        <button type="button" className={MENU_ITEM} onClick={() => void rename(project)}>Rename</button>
                      </MenuItem>
                      <MenuItem>
                        <button type="button" className={MENU_ITEM} onClick={() => void duplicate(project)}>Duplicate</button>
                      </MenuItem>
                      <MenuItem>
                        <button type="button" className={`${MENU_ITEM} text-red-700`} onClick={() => void remove(project)}>Delete</button>
                      </MenuItem>
                    </MenuItems>
                  </Menu>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
