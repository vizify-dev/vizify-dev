import type { ThemeOption } from "@/lib/resume/resume";
import BASE_CSS from "./styles/base.css";
import COMPLETION_CSS from "./styles/themes/completion.css";
import PARTICIPATION_CSS from "./styles/themes/participation.css";
import ACHIEVEMENT_CSS from "./styles/themes/achievement.css";
import APPRECIATION_CSS from "./styles/themes/appreciation.css";
import MINIMAL_CSS from "./styles/themes/minimal.css";

export type SealStyle = "ring" | "badge" | "medal" | "none";

export type CertificateTheme = {
  id: string;
  name: string;
  css: string;
  /** Which seal graphic the theme uses (rendered by render.ts). */
  seal: SealStyle;
};

export const CERTIFICATE_THEMES: CertificateTheme[] = [
  { id: "cert-completion", name: "Completion", css: COMPLETION_CSS, seal: "ring" },
  { id: "cert-participation", name: "Participation", css: PARTICIPATION_CSS, seal: "badge" },
  { id: "cert-achievement", name: "Achievement", css: ACHIEVEMENT_CSS, seal: "medal" },
  { id: "cert-appreciation", name: "Appreciation", css: APPRECIATION_CSS, seal: "badge" },
  { id: "cert-minimal", name: "Minimal", css: MINIMAL_CSS, seal: "none" },
];

export function getCertificateTheme(id?: string): CertificateTheme {
  return CERTIFICATE_THEMES.find((t) => t.id === id) ?? CERTIFICATE_THEMES[0];
}

/** Theme dropdown options. `css` is the full stylesheet shown in the CSS pane (base + theme). */
export const certificatesThemeOptions: ThemeOption[] = CERTIFICATE_THEMES.map((t) => ({
  id: t.id,
  name: t.name,
  css: `${BASE_CSS}\n${t.css}`,
}));
