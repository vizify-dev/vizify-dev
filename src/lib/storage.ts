import type { View } from "@/components/ViewSwitch";

export const VIEWS: View[] = ["table", "resume", "board", "cards", "certificates"];
export type Work = Record<View, { csv: string; css: string }>;
export type Restored = Partial<Record<View, { csv: string | null; css: string | null }>>;

const KEYS: Record<View, { csv: string; css: string }> = {
  table: { csv: "vizify:csv", css: "vizify:css" },
  resume: { csv: "vizify:resume:csv", css: "vizify:resume:css" },
  board: { csv: "vizify:board:csv", css: "vizify:board:css" },
  cards: { csv: "vizify:cards:csv", css: "vizify:cards:css" },
  certificates: { csv: "vizify:certificates:csv", css: "vizify:certificates:css" },
};
const VIEW_KEY = "vizify:view";
const SIDEBAR_KEY = "vizify:sidebar";
const PHOTO_KEY = "vizify:resume:photo";
const handoffKey = (userId: string) => `vizify:handoff:${userId}`;

export function hasHandedOff(userId: string): boolean {
  try {
    return localStorage.getItem(handoffKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function markHandedOff(userId: string) {
  try {
    localStorage.setItem(handoffKey(userId), "1");
  } catch {
    // storage blocked
  }
}

/** Wipes the local draft (used on sign out so the next person doesn't inherit it). */
export function clearWork() {
  try {
    for (const view of VIEWS) {
      localStorage.removeItem(KEYS[view].csv);
      localStorage.removeItem(KEYS[view].css);
    }
    localStorage.removeItem(VIEW_KEY);
    localStorage.removeItem(PHOTO_KEY);
  } catch {
    // storage blocked
  }
}

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
    // storage blocked; width just won't persist
  }
}

/** Reads everything saved so far. Never throws; missing values come back empty. */
export function restore(): { work: Restored; view: View | null; sidebar: number | null; photo: string } {
  const work: Restored = {};
  let view: View | null = null;
  let sidebar: number | null = null;
  let photo = "";
  try {
    for (const v of VIEWS) {
      const csv = localStorage.getItem(KEYS[v].csv);
      const css = localStorage.getItem(KEYS[v].css);
      if (csv !== null || css !== null) work[v] = { csv, css };
    }
    const savedView = localStorage.getItem(VIEW_KEY);
    if (VIEWS.includes(savedView as View)) view = savedView as View;
    sidebar = Number(localStorage.getItem(SIDEBAR_KEY)) || null;
    photo = localStorage.getItem(PHOTO_KEY) ?? "";
  } catch {
    // localStorage unavailable; fall back to defaults.
  }
  return { work, view, sidebar, photo };
}