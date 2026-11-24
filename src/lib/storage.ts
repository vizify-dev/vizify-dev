import type { View } from "@/components/ViewSwitch";

export const VIEWS: View[] = ["table", "resume", "board", "cards", "certificates", "idcard"];
export type Work = Record<View, { csv: string; css: string }>;

export type Restored = Partial<
  Record<View, { csv: string | null; css: string | null; themeId: string | null }>
>;

const KEYS: Record<View, { csv: string; css: string; themeId: string }> = {
  table: { csv: "vizify:csv", css: "vizify:css", themeId: "vizify:theme" },
  resume: { csv: "vizify:resume:csv", css: "vizify:resume:css", themeId: "vizify:resume:theme" },
  idcard: { csv: "vizify:idcard:csv", css: "vizify:idcard:css", themeId: "vizify:idcard:theme" },
  board: { csv: "vizify:board:csv", css: "vizify:board:css", themeId: "vizify:board:theme" },
  cards: { csv: "vizify:cards:csv", css: "vizify:cards:css", themeId: "vizify:cards:theme" },
  certificates: {
    csv: "vizify:certificates:csv",
    css: "vizify:certificates:css",
    themeId: "vizify:certificates:theme",
  },
};

const VIEW_KEY = "vizify:view";
const SIDEBAR_KEY = "vizify:sidebar";
const PHOTO_KEY = "vizify:resume:photo";

export function persist(view: View, csv: string, css: string, themeId = ""): boolean {
  try {
    localStorage.setItem(KEYS[view].csv, csv);
    localStorage.setItem(KEYS[view].css, css);
    if (themeId) localStorage.setItem(KEYS[view].themeId, themeId);
    else localStorage.removeItem(KEYS[view].themeId);
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
    for (const currentView of VIEWS) {
      const csv = localStorage.getItem(KEYS[currentView].csv);
      const css = localStorage.getItem(KEYS[currentView].css);
      const themeId = localStorage.getItem(KEYS[currentView].themeId);

      if (csv !== null || css !== null || themeId !== null) {
        work[currentView] = { csv, css, themeId };
      }
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