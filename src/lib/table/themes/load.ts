import path from "node:path";
import { compile } from "sass";
import { THEME_DEFS } from "./index";
import type { Theme } from "./types";

const themesDir = path.join(process.cwd(), "src/lib/table/themes");

export function loadThemes(): Theme[] {
  return THEME_DEFS.map((def) => ({
    ...def,
    css: compile(path.join(themesDir, def.id, `${def.id}.scss`)).css,
  }));
}
