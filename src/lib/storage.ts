const CSV_KEY = "vizify:csv";
const CSS_KEY = "vizify:css";
const SIDEBAR_KEY = "vizify:sidebar";

export function persist(csv: string, css: string): boolean {
  try {
    localStorage.setItem(CSV_KEY, csv);
    localStorage.setItem(CSS_KEY, css);
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

/** Reads saved table work. Missing values come back empty. */
export function restore(): { csv: string | null; css: string | null; sidebar: number | null } {
  let csv: string | null = null;
  let css: string | null = null;
  let sidebar: number | null = null;
  try {
    csv = localStorage.getItem(CSV_KEY);
    css = localStorage.getItem(CSS_KEY);
    sidebar = Number(localStorage.getItem(SIDEBAR_KEY)) || null;
  } catch {
    // localStorage unavailable; fall back to defaults.
  }
  return { csv, css, sidebar };
}