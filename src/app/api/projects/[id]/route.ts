import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/session";
import { canUseTheme } from "@/lib/plans";
import { ProjectPatch, toApi } from "@/lib/projects";

type Ctx = { params: Promise<{ id: string }> };
const COLS = "id,name,view,csv,css,theme_id,updated_at";
const unauthorized = () => Response.json({ error: "Unauthorized" }, { status: 401 });
const notFound = () => Response.json({ error: "Not found" }, { status: 404 });

export async function GET(_: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const supabase = await createClient();
  const { data } = await supabase
    .from("projects").select(COLS).eq("id", id).eq("user_id", user.id).is("deleted_at", null).maybeSingle();
  return data ? Response.json(toApi(data)) : notFound();
}

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const parsed = ProjectPatch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });
  const p = parsed.data;

  if (p.themeId !== undefined && !canUseTheme(user.plan, p.themeId))
    return Response.json({ error: "Premium theme" }, { status: 403 });

  const update: Record<string, unknown> = {};
  if (p.name !== undefined) update.name = p.name;
  if (p.view !== undefined) update.view = p.view;
  if (p.csv !== undefined) update.csv = p.csv;
  if (p.css !== undefined) update.css = p.css;
  if (p.themeId !== undefined) update.theme_id = p.themeId;

  const supabase = await createClient();
  const { data } = await supabase
    .from("projects").update(update).eq("id", id).eq("user_id", user.id)
    .select(COLS).maybeSingle();
  return data ? Response.json(toApi(data)) : notFound();
}

export async function DELETE(_: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  return data ? new Response(null, { status: 204 }) : notFound();
}