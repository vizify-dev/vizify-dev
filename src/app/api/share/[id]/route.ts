import { buildIdCardDocument } from "@/lib/cards";
import { buildCardsDocument } from "@/lib/cards/render";
import { buildCertificatesDocument } from "@/lib/certificates/render";
import { buildBoardDocument } from "@/lib/jiraboard/render";
import { prisma } from "@/lib/prisma";
import { buildResumeDocument } from "@/lib/resume";
import { buildDocument } from "@/lib/table/preview";

type Context = { params: Promise<{ id: string }> };
type ProjectView = "table" | "resume" | "board" | "cards" | "certificates";

const projectViews: readonly ProjectView[] = [
  "table",
  "resume",
  "board",
  "cards",
  "certificates",
];

function isProjectView(view: string): view is ProjectView {
  return projectViews.some((projectView) => projectView === view);
}

function renderProject(project: {
  view: string;
  csv: string;
  css: string;
  themeId: string | null;
}): string | null {
  if (!isProjectView(project.view)) return null;

  switch (project.view) {
    case "table":
      return buildDocument(project.csv, project.css, false);
    case "resume": {
      const layout =
        project.themeId === "resume-graphic"
          ? "graphic"
          : project.themeId === "resume-sidebar"
            ? "sidebar"
            : project.themeId === "resume-uiux"
              ? "uiux"
              : undefined;
      return buildResumeDocument(project.csv, project.css, "", layout);
    }
    case "board":
      return buildBoardDocument(project.csv, project.css, project.themeId ?? undefined, false);
    case "cards":
      return project.themeId?.startsWith("id-")
        ? buildIdCardDocument(project.csv, project.css)
        : buildCardsDocument(project.csv, project.css, false);
    case "certificates":
      return buildCertificatesDocument(project.csv, project.css, project.themeId ?? undefined, false);
  }
}

export async function GET(_: Request, { params }: Context) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: { view: true, csv: true, css: true, themeId: true },
  });
  if (!project) return new Response("Not found", { status: 404 });

  const document = renderProject(project);
  if (!document) return new Response("Not found", { status: 404 });

  return new Response(document, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy":
        "sandbox; default-src 'none'; img-src https: data:; style-src 'unsafe-inline' https: data:; font-src https: data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
