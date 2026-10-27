import { boldTracker } from "./bold-tracker/bold-tracker";
import { editorial } from "./editorial/editorial";
import { glassTasks } from "./glass-tasks/glass-tasks";
import { invoice } from "./invoice/invoice";
import { neonBoard } from "./neon-board/neon-board";
import { notebook } from "./notebook/notebook";
import { playfulPastel } from "./playful-pastel/playful-pastel";
import { receipt } from "./receipt/receipt";
import { terminal } from "./terminal/terminal";
import type { ThemeDef } from "./types";
import { violetCards } from "./violet-cards/violet-cards";

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
