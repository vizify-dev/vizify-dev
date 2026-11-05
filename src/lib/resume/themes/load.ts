import path from "node:path";
import { compile } from "sass";
import { RESUME_THEME_DEFS, type ThemeOption } from "../resume";

const themesDir = path.join(process.cwd(), "src", "lib", "resume", "themes");

export function loadResumeThemes(): ThemeOption[] {
  const baseCss = compile(path.join(themesDir, "..", "base.scss")).css;
  return RESUME_THEME_DEFS.map(({ directory, ...theme }) => ({
    ...theme,
    css: `${baseCss}\n${compile(path.join(themesDir, directory, "resume.scss")).css}`,
  }));
}
