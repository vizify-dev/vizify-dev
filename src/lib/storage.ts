import type { View } from "@/components/ViewSwitch";

export const VIEWS: View[] = ["table", "resume"];
export type Work = Record<View, { csv: string; css: string }>;
export type Restored = Partial<Record<View, { csv: string | null; css: string | null }>>;

const KEYS: Record<View, { csv: string; css: string }> = {
  table: { csv: "vizify:csv", css: "vizify:css" },
  resume: { csv: "vizify:resume:csv", css: "vizify:resume:css" },
};
const VIEW_KEY = "vizify:view";
const SIDEBAR_KEY = "vizify:sidebar";

export function persist(view: View, csv: string, css: string): boolean {
  try {
    localStorage.setItem(KEYS[view].csv, csv);
    localStorage.setItem(KEYS[view].css, css);
    localStorage.setItem(VIEW_KEY, view);
    return true;
  } catch {
    return false; // storage blocked or full
  }
}

export function saveSidebar(width: number) {
  try {
    localStorage.setItem(SIDEBAR_KEY, String(width));
  } catch {
    // storage blocked; width just won't persist
  }
}

/** Reads everything saved so far. Never throws; missing values come back empty. */
export function restore(): { work: Restored; view: View | null; sidebar: number | null } {
  const work: Restored = {};
  let view: View | null = null;
  let sidebar: number | null = null;
  try {
    for (const v of VIEWS) {
      const csv = localStorage.getItem(KEYS[v].csv);
      const css = localStorage.getItem(KEYS[v].css);
      if (csv !== null || css !== null) work[v] = { csv, css };
    }
    const savedView = localStorage.getItem(VIEW_KEY);
    if (savedView === "table" || savedView === "resume") view = savedView;
    sidebar = Number(localStorage.getItem(SIDEBAR_KEY)) || null;
  } catch {
    // localStorage unavailable; fall back to defaults.
  }
  return { work, view, sidebar };
}