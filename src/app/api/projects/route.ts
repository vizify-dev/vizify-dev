import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/session";
import { canUseTheme } from "@/lib/plans";
import { ProjectInput, toApi } from "@/lib/projects";
import { cssKey, csvKey, putCss, putCsv } from "@/lib/s3";

const COLS = "id,name,view,theme_id,updated_at";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const view = new URL(req.url).searchParams.get("view");
  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select(COLS)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (view) query = query.eq("view", view);

  const { data, error } = await query;
  if (error) return Response.json({ error: "Failed" }, { status: 500 });
  return Response.json(data.map(toApi));
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = ProjectInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    console.error("project create: invalid input", parsed.error.flatten());
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
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

  const key = csvKey(user.id, data.id);
  try {
    const etag = await putCsv(key, input.csv);
    await putCss(cssKey(key), input.css);
    const { data: saved, error: syncError } = await supabase
      .from("projects")
      .update({
        s3_key: key,
        s3_etag: etag,
        synced_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("user_id", user.id)
      .select(COLS)
      .single();
    if (syncError) throw syncError;
    return Response.json(toApi(saved), { status: 201 });
  } catch (e) {
    console.error("project create: S3 write failed", e);
    const { error: cleanupError } = await supabase
      .from("projects")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", user.id);
    if (cleanupError) console.error("project create: cleanup failed", cleanupError);
    return Response.json({ error: "Could not save project files" }, { status: 502 });
  }
}