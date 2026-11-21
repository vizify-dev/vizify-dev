import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/session";
import { canUseTheme } from "@/lib/plans";
import { ProjectInput, toApi } from "@/lib/projects";

const COLS = "id,name,view,theme_id,updated_at";

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(COLS)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) return Response.json({ error: "Failed" }, { status: 500 });
  return Response.json(data.map(toApi));
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = ProjectInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });
  const input = parsed.data;

  if (!canUseTheme(user.plan, input.themeId))
    return Response.json({ error: "Premium theme" }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: input.name,
      view: input.view,
      csv: input.csv,
      css: input.css,
      theme_id: input.themeId ?? null,
    })
    .select(COLS)
    .single();

  if (error?.message.includes("project_limit_reached"))
    return Response.json({ error: "Project limit reached" }, { status: 403 });
  if (error) return Response.json({ error: "Failed" }, { status: 500 });
  return Response.json(toApi(data), { status: 201 });
}