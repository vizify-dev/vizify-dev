import { createAdminClient } from "@/lib/supabase/admin";
import { buildDocument } from "@/lib/table/preview";
import { buildBoardDocument } from "@/lib/jiraboard/render";
import { buildCertificatesDocument } from "@/lib/certificates/render";
// import resume / cards builders the same way

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
  switch (view) {
    case "table": return buildDocument(csv, css, false);
    case "board": return buildBoardDocument(csv, css, themeId, false);
    case "certificates": return buildCertificatesDocument(csv, css, themeId, false);
    // case "resume": return buildResumeDocument(csv, css, "", layoutFromTheme(themeId));
    // case "cards": return buildCardsDocument(...);
    default: return null;
  }
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("projects").select("view,csv,css,theme_id").eq("id", id).maybeSingle();
  if (!data) return new Response("Not found", { status: 404 });

  const html = render(data.view, data.csv, data.css, data.theme_id ?? undefined);
  if (!html) return new Response("Not found", { status: 404 });
  return new Response(html, { headers: HEADERS });
}