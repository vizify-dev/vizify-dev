import type { ViewId } from "@/lib/jiraboard/views";

/**
 * Per-view launch flags. Resume is always available; every other view is off
 * until its NEXT_PUBLIC_FEATURE_* variable is set to "true".
 * (Each variable is read literally so Next.js can inline it at build time.)
 */
export const VIEW_FLAGS: Record<ViewId, boolean> = {
  resume: true,
  table: process.env.NEXT_PUBLIC_FEATURE_TABLE === "true",
  idcard: process.env.NEXT_PUBLIC_FEATURE_IDCARD === "true",
  board: process.env.NEXT_PUBLIC_FEATURE_BOARD === "true",
  cards: process.env.NEXT_PUBLIC_FEATURE_CARDS === "true",
  certificates: process.env.NEXT_PUBLIC_FEATURE_CERTIFICATES === "true",
};

export function isViewEnabled(view: ViewId): boolean {
  return VIEW_FLAGS[view];
}

/** The view to open on a fresh load: Table when enabled, otherwise Resume. */
export const DEFAULT_VIEW: ViewId = VIEW_FLAGS.table ? "table" : "resume";
