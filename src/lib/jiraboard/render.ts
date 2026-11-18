import { parseCsv } from "@/lib/csv-parser";
import { escapeHtml as esc } from "@/lib/html";
import { JIRA_CHIPS, boardCss, getBoardTheme } from "./board-themes";
import type { ViewOutput } from "./views";

import DOCUMENT_HTML from "./templates/document.html";
import BOARD_HTML from "./templates/board.html";
import TOOLBAR_HTML from "./templates/toolbar.html";
import LANE_HTML from "./templates/lane.html";
import CARD_HTML from "./templates/card.html";
import CHIPS_HTML from "./templates/chips.html";
import CHIP_HTML from "./templates/chip.html";
import PRIORITY_HTML from "./templates/priority.html";
import POINTS_HTML from "./templates/points.html";
import KEY_HTML from "./templates/key.html";
import AVATAR_HTML from "./templates/avatar.html";
import ERROR_HTML from "./templates/error.html";
import INTERACTIVE_CSS from "./styles/interactive.css";
import PRINT_CSS from "./styles/print.css";
import SCRIPT_HTML from "./runtime/board.script.html";
import RUNTIME from "./runtime/board.runtime.generated.txt";

const SCRIPT = SCRIPT_HTML.replace("/* BOARD_RUNTIME */", () => RUNTIME);

const ORDER = [
  "backlog", "to do", "todo", "open", "selected for development",
  "in progress", "in review", "code review", "review", "testing", "qa",
  "done", "closed", "resolved",
];
const DONE = new Set(["done", "closed", "resolved"]);
const AVATARS = ["#0052cc", "#00875a", "#ff5630", "#6554c0", "#00b8d9", "#ff991f"];
const PRIORITY: Record<string, { path: string; color: string }> = {
  highest: { path: "M4 8l4-4 4 4M4 12l4-4 4 4", color: "#bf2600" },
  high: { path: "M4 10l4-4 4 4", color: "#de350b" },
  medium: { path: "M3 6h10M3 10h10", color: "#ff991f" },
  low: { path: "M4 6l4 4 4-4", color: "#36b37e" },
  lowest: { path: "M4 4l4 4 4-4M4 8l4 4 4-4", color: "#00875a" },
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
const rank = (lane: string) => {
  const i = ORDER.indexOf(lane.toLowerCase());
  return i === -1 ? ORDER.indexOf("done") - 0.5 : i; // unknown statuses sit just before Done
};

/** Fills `<!-- TOKEN -->` slots in a template. Values are inserted verbatim (escape before calling). */
function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (html, [token, value]) => html.replace(`<!-- ${token} -->`, () => value),
    template.trim(),
  );
}

export function renderBoard(rows: string[][], themeId?: string, interactive = true): ViewOutput {
  const theme = getBoardTheme(themeId);
  const css = boardCss(theme);
  const chipPalette = theme.chips ?? JIRA_CHIPS;
  const [header = [], ...data] = rows;
  const names = header.map((h) => h.trim().toLowerCase());
  const find = (...aliases: string[]) =>
    names.flatMap((n, i) => (aliases.includes(n) ? [i] : []));
  const cols = {
    summary: find("summary", "title"),
    status: find("status"),
    key: find("issue key", "key"),
    priority: find("priority"),
    assignee: find("assignee"),
    labels: find("labels", "label"), // Jira exports repeat this column
    points: names.flatMap((n, i) => (/story points?/.test(n) ? [i] : [])),
  };

  const missing = [
    ...(cols.summary.length ? [] : ["Summary"]),
    ...(cols.status.length ? [] : ["Status"]),
  ];
  if (missing.length) {
    return {
      css,
      body: fill(ERROR_HTML, {
        MISSING: esc(missing.join(", ")),
        FOUND: esc(header.join(", ") || "none"),
      }),
    };
  }

  const cell = (r: string[], idx: number[]) =>
    idx.map((i) => (r[i] ?? "").trim()).filter(Boolean);

  const lanes = new Map<string, string[][]>();
  for (const r of data) {
    const s = cell(r, cols.status)[0] ?? "No status";
    lanes.set(s, [...(lanes.get(s) ?? []), r]);
  }

  let n = 0; // card counter, drives cardColors
  const renderCard = (r: string[], done: boolean) => {
    const labels = cell(r, cols.labels)
      .flatMap((l) => l.split(/[;|]/))
      .map((l) => l.trim())
      .filter(Boolean);
    const chipList = labels
      .map((l) => {
        const [bg, fg] = chipPalette[hash(l) % chipPalette.length];
        return fill(CHIP_HTML, { BG: bg, FG: fg, LABEL: esc(l) });
      })
      .join("");
    const prioKey = slug(cell(r, cols.priority)[0] ?? "");
    const prio = PRIORITY[prioKey];
    const pts = cell(r, cols.points)[0];
    const key = cell(r, cols.key)[0];
    const who = cell(r, cols.assignee)[0];
    const initials = who ? who.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() : "";
    return fill(CARD_HTML, {
      CARD_STYLE: theme.cardColors ? ` style="--card:${theme.cardColors[n++ % theme.cardColors.length]}"` : "",
      PRIORITY_ID: prio ? prioKey : "",
      TITLE: esc(cell(r, cols.summary)[0] ?? ""),
      CHIPS: chipList ? fill(CHIPS_HTML, { CHIP_LIST: chipList }) : "",
      PRIORITY: prio ? fill(PRIORITY_HTML, { COLOR: prio.color, PATH: prio.path }) : "",
      POINTS: pts ? fill(POINTS_HTML, { POINTS: esc(pts) }) : "",
      KEY: key ? fill(KEY_HTML, { DONE: done ? " done" : "", KEY: esc(key) }) : "",
      AVATAR: who
        ? fill(AVATAR_HTML, { NAME: esc(who), COLOR: AVATARS[hash(who) % AVATARS.length], INITIALS: esc(initials) })
        : "",
    });
  };

  const laneHtml = [...lanes.entries()]
    .sort((a, b) => rank(a[0]) - rank(b[0]))
    .map(([name, items], i) => {
      const done = DONE.has(name.toLowerCase());
      const style = [
        theme.laneColors && `--lane:${theme.laneColors[i % theme.laneColors.length]}`,
        theme.laneTitles && `--lane-t:${theme.laneTitles[i % theme.laneTitles.length]}`,
      ]
        .filter(Boolean)
        .join(";");
      return fill(LANE_HTML, {
        LANE_ID: slug(name),
        LANE_STYLE: style ? ` style="${style}"` : "",
        LANE_NAME: esc(name),
        LANE_COUNT: String(items.length),
        CARDS: items.map((r) => renderCard(r, done)).join(""),
      });
    })
    .join("");

  return {
    css,
    body: fill(BOARD_HTML, { TOOLBAR: interactive ? TOOLBAR_HTML.trim() : "", LANES: laneHtml }),
  };
}

/**
 * Standalone board page. `css` is the stylesheet from the editor (so edits show live);
 * `themeId` only drives the inline per-card/lane colors and label chips.
 * interactive=false gives a static copy (no script, no search box), used for PDF export.
 */
export function buildBoardDocument(csv: string, css: string, themeId?: string, interactive = true): string {
  const { body } = renderBoard(parseCsv(csv), themeId, interactive);
  const values: Record<string, string> = {
    "/* THEME_CSS */": css.replace(/<\/style/gi, "<\\/style"),
    "/* INTERACTIVE_CSS */": interactive ? INTERACTIVE_CSS : "",
    "/* PRINT_CSS */": PRINT_CSS,
    "<!-- BODY -->": body,
    "<!-- SCRIPT -->": interactive ? SCRIPT : "",
  };
  return Object.entries(values).reduce(
    (doc, [token, value]) => doc.replace(token, () => value),
    DOCUMENT_HTML,
  );
}
