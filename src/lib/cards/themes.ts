import type { ThemeOption } from "@/lib/resume/resume";
import BASE_CSS from "./styles/base.css?raw";
import CORPORATE_CSS from "./styles/themes/corporate.css?raw";
import MIDNIGHT_GOLD_CSS from "./styles/themes/midnight-gold.css?raw";
import CAMPUS_CSS from "./styles/themes/campus.css?raw";
import MINIMAL_MONO_CSS from "./styles/themes/minimal-mono.css?raw";
import GRADIENT_POP_CSS from "./styles/themes/gradient-pop.css?raw";
import ECO_GREEN_CSS from "./styles/themes/eco-green.css?raw";
import CLEAN_CSS from "./styles/themes/clean.css?raw";
import DARK_CSS from "./styles/themes/dark.css?raw";
import DUO_CSS from "./styles/themes/duo.css?raw";
import PATTERN_CSS from "./styles/themes/pattern.css?raw";

export const LEGACY_CARD_THEME_IDS: string[] = [
  "cards-clean",
  "cards-dark",
  "cards-pattern",
  "cards-duo",
];

const THEMES = [
  { id: "cards-corporate", name: "Corporate Blue", css: CORPORATE_CSS },
  { id: "cards-gradient", name: "Gradient Pop", css: GRADIENT_POP_CSS },
  { id: "cards-midnight-gold", name: "Midnight Gold", css: MIDNIGHT_GOLD_CSS },
  { id: "cards-campus", name: "Campus", css: CAMPUS_CSS },
  { id: "cards-eco", name: "Eco Green", css: ECO_GREEN_CSS },
  { id: "cards-mono", name: "Minimal Mono", css: MINIMAL_MONO_CSS },
  { id: "cards-clean", name: "Clean (green)", css: CLEAN_CSS },
  { id: "cards-dark", name: "Dark", css: DARK_CSS },
  { id: "cards-pattern", name: "Pattern (orange)", css: PATTERN_CSS },
  { id: "cards-duo", name: "Duo (yellow/black)", css: DUO_CSS },
];

/** Theme dropdown options. `css` is the full stylesheet shown in the CSS pane (base + theme). */
export const cardsThemeOptions: ThemeOption[] = THEMES.map((t) => ({
  id: t.id,
  name: t.name,
  css: LEGACY_CARD_THEME_IDS.includes(t.id)
    ? t.css
    : `${BASE_CSS}\n${t.css}`,
}));

export function migrateLegacyCardsThemeCss(css: string): string {
  const legacyTheme = [
    { id: "cards-clean", page: "#1b1b1d", accent: "#19d38a" },
    { id: "cards-dark", page: "#2b2c2e", accent: "#d6d3c4" },
    { id: "cards-duo", page: "#c9c9c7", accent: "#f5b000" },
    { id: "cards-pattern", page: "#e6e7ea", accent: "#f0a62a" },
  ].find(
    ({ page, accent }) =>
      css.includes(".id-card") &&
      css.includes(`--page:${page}`) &&
      css.includes(`--c1:${accent}`),
  );
  return cardsThemeOptions.find((theme) => theme.id === legacyTheme?.id)?.css ?? css;
}
