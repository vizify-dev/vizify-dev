import { boldTracker } from "./bold-tracker";
import { editorial } from "./editorial";
import { glassTasks } from "./glass-tasks";
import { invoice } from "./invoice";
import { neonBoard } from "./neon-board";
import { notebook } from "./notebook";
import { playfulPastel } from "./playful-pastel";
import { receipt } from "./receipt";
import { terminal } from "./terminal";
import type { ThemeDef } from "./types";
import { violetCards } from "./violet-cards";

export type { Theme, ThemeDef } from "./types";

export const THEME_DEFS: ThemeDef[] = [
  invoice,
  glassTasks,
  neonBoard,
  playfulPastel,
  boldTracker,
  violetCards,
  notebook,
  receipt,
  terminal,
  editorial,
];
