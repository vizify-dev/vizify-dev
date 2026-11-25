import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/session";
import { toApi } from "@/lib/projects";

type Ctx = { params: Promise<{ id: string }> };
const COLS = "id,name,view,csv,css,theme_id,updated_at";

export async function POST(_: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const supabase = await createClient();
  const { data: src } = await supabase
    .from("projects")
    .select("name,view,csv,css,theme_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!src) return Response.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: `${src.name} (copy)`.slice(0, 100),
      view: src.view,
      csv: src.csv,
      css: src.css,
      theme_id: src.theme_id,
    })
    .select(COLS)
    .single();

  if (error?.message.includes("project_limit_reached"))
    return Response.json({ error: "Project limit reached" }, { status: 403 });
  if (error) return Response.json({ error: "Failed" }, { status: 500 });
  return Response.json(toApi(data), { status: 201 });
}