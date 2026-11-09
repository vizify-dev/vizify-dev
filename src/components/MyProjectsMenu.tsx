"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useState } from "react";
import { buttonClass } from "@/components/Button";
import { ChevronDownIcon } from "@/components/Icons";

export type ProjectSummary = { id: string; name: string; view: string; updatedAt: string };

const ITEM =
  "flex w-full cursor-pointer flex-col items-start gap-[2px] rounded-[8px] px-[10px] py-[8px] text-left text-ink data-focus:bg-sunken";

export default function MyProjectsMenu({
  activeId,
  onOpen,
  onNew,
  onDeleted,
}: {
  activeId?: string;
  onOpen: (id: string) => void;
  onNew: () => void;
  onDeleted: (project: ProjectSummary) => void;
}) {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Couldn't load projects.");
      setProjects((await response.json()) as ProjectSummary[]);
      setFailed(false);
      setDeleteError("");
    } catch {
      setFailed(true);
    }
  }

  async function remove(project: ProjectSummary) {
    if (!window.confirm(`Delete "${project.name}"? This can't be undone.`)) return;
    try {
      const response = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Couldn't delete this project.");
      setProjects((list) => list?.filter((item) => item.id !== project.id) ?? null);
      setDeleteError("");
      onDeleted(project);
    } catch {
      setDeleteError("Couldn't delete this project. Please try again.");
    }
  }

  return (
    <Menu>
      <MenuButton onClick={() => void load()} className={`group ${buttonClass("outline")}`}>
        My projects
        <ChevronDownIcon className="size-[16px] transition-transform group-data-open:rotate-180" />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        transition
        className="z-50 max-h-[360px] w-[300px] overflow-y-auto rounded-[12px] border border-line bg-surface p-[6px] shadow-xl [--anchor-gap:6px] focus:outline-none transition duration-100 ease-out data-closed:scale-95 data-closed:opacity-0"
      >
        <MenuItem>
          <button type="button" className={ITEM} onClick={onNew}>
            <span className="text-[14px] font-semibold">+ New project</span>
          </button>
        </MenuItem>
        <div className="mx-[4px] my-[6px] h-px bg-line" />

        {failed && <p className="px-[10px] py-[8px] text-[13px] text-red-600">Couldn&apos;t load projects.</p>}
        {!failed && projects === null && (
          <p className="px-[10px] py-[8px] text-[13px] text-ink3">Loading&hellip;</p>
        )}
        {projects?.length === 0 && (
          <p className="px-[10px] py-[8px] text-[13px] text-ink3">No saved projects yet.</p>
        )}
        {deleteError && <p className="px-[10px] py-[8px] text-[13px] text-red-600">{deleteError}</p>}

        {projects?.map((project) => (
          <div key={project.id} className="flex items-center gap-[4px]">
            <MenuItem>
              <button
                type="button"
                onClick={() => onOpen(project.id)}
                className={`${ITEM} min-w-0 flex-1 ${project.id === activeId ? "bg-sunken" : ""}`}
              >
                <span className="w-full truncate text-[14px] font-semibold">{project.name}</span>
                <span className="text-[12px] text-ink3 capitalize">
                  {project.view} · {new Date(project.updatedAt).toLocaleDateString()}
                </span>
              </button>
            </MenuItem>
            <button
              type="button"
              aria-label={`Delete ${project.name}`}
              onClick={() => void remove(project)}
              className="flex size-[28px] shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-ink3 hover:bg-sunken hover:text-red-600"
            >
              ×
            </button>
          </div>
        ))}
      </MenuItems>
    </Menu>
  );
}
