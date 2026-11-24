import { z } from "zod";

export const VIEWS = ["table", "resume", "board", "cards", "certificates"] as const;

export const ProjectInput = z.object({
  name: z.string().trim().min(1).max(100).default("Untitled project"),
  view: z.enum(VIEWS),
  csv: z.string().max(500_000),
  css: z.string().max(500_000),
  themeId: z.string().max(50).nullable().optional(),
});
export const ProjectPatch = ProjectInput.partial().refine(
  (o) => Object.keys(o).length > 0,
  "Empty patch",
);

type Row = { id: string; name: string; view: string; csv?: string; css?: string; theme_id: string | null; updated_at: string };

/** DB row (snake_case) -> API shape the frontend already expects */
export const toApi = (r: Row) => ({
  id: r.id,
  name: r.name,
  view: r.view,
  ...(r.csv !== undefined && { csv: r.csv }),
  ...(r.css !== undefined && { css: r.css }),
  themeId: r.theme_id,
  updatedAt: r.updated_at,
});