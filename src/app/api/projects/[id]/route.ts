import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/session";
import { canUseTheme } from "@/lib/plans";
import { ProjectPatch, toApi } from "@/lib/projects";
import { cssKey, csvKey, getCsv, getCss, getPhoto, headCsv, photoKey } from "@/lib/s3";

type Ctx = { params: Promise<{ id: string }> };
const COLS = "id,name,view,csv,css,theme_id,updated_at";
const unauthorized = () => Response.json({ error: "Unauthorized" }, { status: 401 });
const notFound = () => Response.json({ error: "Not found" }, { status: 404 });

export async function GET(_: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(`${COLS},s3_key,s3_etag`)
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) {
    console.error("project: lookup failed", error);
    return Response.json({ error: "Could not load project" }, { status: 500 });
  }
  if (!data) return notFound();

  const key = data.s3_key ?? csvKey(user.id, id);
  try {
    const remoteEtag = await headCsv(key);
    const [remoteCsv, remoteCss, photo] = await Promise.all([
      remoteEtag ? getCsv(key) : Promise.resolve(null),
      getCss(cssKey(key)),
      getPhoto(photoKey(key)),
    ]);
    return Response.json({
      ...toApi(data),
      csv: remoteCsv?.text ?? data.csv,
      css: remoteCss ?? data.css,
      photo,
      etag: remoteCsv?.etag ?? data.s3_etag,
    });
  } catch (e) {
    console.error("project: S3 load failed", e);
    return Response.json({ error: "Could not load project files" }, { status: 502 });
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const parsed = ProjectPatch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    console.error("project patch: invalid input", parsed.error.flatten());
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  const { expectedUpdatedAt, ...p } = parsed.data;

  if (p.themeId !== undefined && !canUseTheme(user.plan, p.themeId))
    return Response.json({ error: "Premium theme" }, { status: 403 });

  const update: Record<string, unknown> = {};
  if (p.name !== undefined) update.name = p.name;
  if (p.view !== undefined) update.view = p.view;
  if (p.csv !== undefined) update.csv = p.csv;
  if (p.css !== undefined) update.css = p.css;
  if (p.themeId !== undefined) update.theme_id = p.themeId;

  const supabase = await createClient();
  const query = supabase
    .from("projects")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null);
  const { data, error } = await (expectedUpdatedAt
    ? query.eq("updated_at", expectedUpdatedAt)
    : query)
    .select(COLS)
    .maybeSingle();
  if (error) {
    console.error("project: update failed", error);
    return Response.json({ error: "Could not update project" }, { status: 500 });
  }
  if (data) return Response.json(toApi(data));

  const { data: current } = await supabase
    .from("projects")
    .select("updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (current && expectedUpdatedAt) {
    return Response.json(
      { error: "This resume changed elsewhere.", updatedAt: current.updated_at },
      { status: 409 },
    );
  }
  return notFound();
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