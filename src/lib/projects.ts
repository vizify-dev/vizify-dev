import { z } from "zod";

const MAX = 500_000;

export const projectInput = z.object({
  name: z.string().trim().min(1).max(100).default("Untitled project"),
  view: z.enum(["table", "resume", "board", "cards", "certificates"]),
  csv: z.string().max(MAX),
  css: z.string().max(MAX),
  themeId: z.string().max(50).nullable().optional(),
});

export const projectPatch = projectInput
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update");
