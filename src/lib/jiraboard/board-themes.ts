import type { ThemeOption } from "@/lib/resume/resume";
import BASE_CSS from "./styles/base.css";
import JIRA_CSS from "./styles/themes/jira.css";
import LINEAR_CSS from "./styles/themes/linear.css";
import AURORA_CSS from "./styles/themes/aurora.css";
import NEON_CSS from "./styles/themes/neon.css";
import PAPER_CSS from "./styles/themes/paper.css";
import SUNSET_CSS from "./styles/themes/sunset.css";
import STICKY_CSS from "./styles/themes/sticky.css";
import BLUEPRINT_CSS from "./styles/themes/blueprint.css";

export type Chip = [bg: string, fg: string];

export type BoardTheme = {
  id: string;
  name: string;
  /** Theme overrides (CSS file), appended after the base stylesheet. */
  css: string;
  /** Label chip colors, picked by hashing the label text. */
  chips?: Chip[];
  /** Per-card background (--card), cycled in order. */
  cardColors?: string[];
  /** Per-lane background / title color, cycled in order. */
  laneColors?: string[];
  laneTitles?: string[];
};

export const JIRA_CHIPS: Chip[] = [
  ["#dfe1e6", "#42526e"],
  ["#deebff", "#0747a6"],
  ["#e3fcef", "#006644"],
  ["#eae6ff", "#403294"],
  ["#ffebe6", "#bf2600"],
  ["#fff0b3", "#172b4d"],
];

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: "board-linear",
    name: "Linear Dark",
    css: LINEAR_CSS,
    chips: [
      ["rgba(94,106,210,.18)", "#a5acf2"], ["rgba(45,170,255,.15)", "#7cc4f8"],
      ["rgba(47,182,124,.15)", "#6fd4a4"], ["rgba(245,166,35,.15)", "#f2c066"],
      ["rgba(239,92,72,.15)", "#f59a8c"], ["rgba(180,120,240,.16)", "#d2a9f5"],
    ],
  },
  { id: "board-jira", name: "Jira Classic", css: JIRA_CSS },
  {
    id: "board-aurora",
    name: "Aurora Glass",
    css: AURORA_CSS,
    chips: [
      ["rgba(255,255,255,.2)", "#ffffff"], ["rgba(167,139,250,.35)", "#f3eeff"],
      ["rgba(34,211,238,.3)", "#e0fbff"], ["rgba(244,114,182,.35)", "#ffe4f1"],
    ],
  },
  {
    id: "board-neon",
    name: "Neon Night",
    css: NEON_CSS,
    chips: [
      ["rgba(0,229,255,.12)", "#4df0ff"], ["rgba(255,46,196,.12)", "#ff7ad9"],
      ["rgba(57,255,136,.12)", "#7dffb0"], ["rgba(168,130,255,.15)", "#c9b3ff"],
      ["rgba(255,214,0,.12)", "#ffe45c"],
    ],
  },
  {
    id: "board-paper",
    name: "Paper",
    css: PAPER_CSS,
    chips: [
      ["#e3e2e0", "#32302c"], ["#d3e5ef", "#183347"], ["#dbeddb", "#1c3829"],
      ["#e8deee", "#412454"], ["#fadec9", "#49290e"], ["#f5e0e9", "#4c2337"],
      ["#fdecc8", "#402c1b"],
    ],
  },
  {
    id: "board-sunset",
    name: "Sunset",
    css: SUNSET_CSS,
    laneColors: ["#ffe4e6", "#fef3c7", "#dbeafe", "#dcfce7", "#ede9fe", "#cffafe"],
    laneTitles: ["#9f1239", "#92400e", "#1e40af", "#166534", "#5b21b6", "#155e75"],
    chips: [
      ["#fecdd3", "#9f1239"], ["#fde68a", "#92400e"], ["#bfdbfe", "#1e40af"],
      ["#bbf7d0", "#166534"], ["#ddd6fe", "#5b21b6"], ["#a5f3fc", "#155e75"],
    ],
  },
  {
    id: "board-sticky",
    name: "Sticky Notes",
    css: STICKY_CSS,
    cardColors: ["#fff176", "#ffab91", "#81d4fa", "#a5d6a7", "#f8bbd0", "#ce93d8"],
    chips: [["rgba(0,0,0,.12)", "#333"]],
  },
  {
    id: "board-blueprint",
    name: "Blueprint",
    css: BLUEPRINT_CSS,
    chips: [["transparent", "#9cc3ff"], ["transparent", "#ffd479"], ["transparent", "#7dffc0"]],
  },
];

export function getBoardTheme(id?: string): BoardTheme {
  return BOARD_THEMES.find((t) => t.id === id) ?? BOARD_THEMES[0];
}

/** Full stylesheet for a theme: shared base + the theme's overrides. */
export function boardCss(theme: BoardTheme): string {
  return `${BASE_CSS}\n${theme.css}`;
}

/** Theme dropdown options for the playground. `css` is what the CSS pane shows. */
export const boardThemeOptions: ThemeOption[] = BOARD_THEMES.map((t) => ({
  id: t.id,
  name: t.name,
  css: boardCss(t),
}));
