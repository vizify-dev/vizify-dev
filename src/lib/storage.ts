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
const PHOTO_KEY = "vizify:resume:photo";

export function persist(view: View, csv: string, css: string): boolean {
  try {
    localStorage.setItem(KEYS[view].csv, csv);
    localStorage.setItem(KEYS[view].css, css);
    localStorage.setItem(VIEW_KEY, view);
    return true;
  } catch {
    return false;
  }
}

/** Saves the uploaded resume photo (a data URL). An empty string removes it. */
export function savePhoto(photo: string): boolean {
  try {
    if (photo) localStorage.setItem(PHOTO_KEY, photo);
    else localStorage.removeItem(PHOTO_KEY);
    return true;
  } catch {
    return false;
  }
}

export function saveSidebar(width: number) {
  try {
    localStorage.setItem(SIDEBAR_KEY, String(width));
  } catch {
    // Storage blocked; width just won't persist.
  }
}

/** Reads everything saved so far. Missing values come back empty. */
export function restore(): {
  work: Restored;
  view: View | null;
  sidebar: number | null;
  photo: string;
} {
  const work: Restored = {};
  let view: View | null = null;
  let sidebar: number | null = null;
  let photo = "";
  try {
    for (const currentView of VIEWS) {
      const csv = localStorage.getItem(KEYS[currentView].csv);
      const css = localStorage.getItem(KEYS[currentView].css);
      if (csv !== null || css !== null) work[currentView] = { csv, css };
    }
    const savedView = localStorage.getItem(VIEW_KEY);
    if (savedView === "table" || savedView === "resume") view = savedView;
    sidebar = Number(localStorage.getItem(SIDEBAR_KEY)) || null;
    photo = localStorage.getItem(PHOTO_KEY) ?? "";
  } catch {
    // localStorage unavailable; fall back to defaults.
  }
  return { work, view, sidebar, photo };
}
