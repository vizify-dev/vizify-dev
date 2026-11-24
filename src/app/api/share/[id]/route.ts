import { createClient } from "@/lib/supabase/server";
import { buildResumeDocument } from "@/lib/resume";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex",
  // tighten after checking real theme output (fonts/images)
  "Content-Security-Policy":
    "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data:",
};

function render(view: string, csv: string, css: string, themeId?: string) {
  if (view !== "resume") return null;

  const layout =
    themeId === "resume-graphic"
      ? "graphic"
      : themeId === "resume-boardroom"
        ? "executive"
        : themeId === "resume-sidebar"
          ? "sidebar"
          : themeId === "resume-uiux"
            ? "uiux"
            : undefined;

  return buildResumeDocument(csv, css, "", layout);
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_resume", { p_id: id });
  if (error) return new Response("Not found", { status: 404 });

  const project = Array.isArray(data) ? data[0] : null;
  if (!project) return new Response("Not found", { status: 404 });

  const html = render("resume", project.csv, project.css, project.theme_id);
  if (!html) return new Response("Not found", { status: 404 });
  return new Response(html, { headers: HEADERS });
}