import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/session";
import { toApi } from "@/lib/projects";
import {
  cssKey,
  csvKey,
  getCss,
  getCsv,
  getPhoto,
  headCsv,
  photoKey,
  putCss,
  putCsv,
  putPhoto,
} from "@/lib/s3";

type Ctx = { params: Promise<{ id: string }> };
const COLS = "id,name,view,csv,css,theme_id,updated_at";

export async function POST(_: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const supabase = await createClient();
  const { data: src } = await supabase
    .from("projects")
    .select("name,view,csv,css,theme_id,s3_key")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!src) return Response.json({ error: "Not found" }, { status: 404 });

  const sourceKey = src.s3_key ?? csvKey(user.id, id);
  let sourceCsv = src.csv;
  let sourceCss = src.css;
  let sourcePhoto: string | null;
  try {
    const sourceEtag = await headCsv(sourceKey);
    const [remoteCsv, remoteCss, photo] = await Promise.all([
      sourceEtag ? getCsv(sourceKey) : Promise.resolve(null),
      getCss(cssKey(sourceKey)),
      getPhoto(photoKey(sourceKey)),
    ]);
    sourceCsv = remoteCsv?.text ?? sourceCsv;
    sourceCss = remoteCss ?? sourceCss;
    sourcePhoto = photo;
  } catch (e) {
    console.error("project duplicate: source files could not be loaded", e);
    return Response.json({ error: "Could not load project files" }, { status: 502 });
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: `${src.name} (copy)`.slice(0, 100),
      view: src.view,
      csv: sourceCsv,
      css: sourceCss,
      theme_id: src.theme_id,
    })
    .select(COLS)
    .single();

  if (error?.message.includes("project_limit_reached"))
    return Response.json({ error: "Project limit reached" }, { status: 403 });
  if (error) return Response.json({ error: "Failed" }, { status: 500 });

  const targetKey = csvKey(user.id, data.id);
  try {
    const etag = await putCsv(targetKey, sourceCsv);
    await putCss(cssKey(targetKey), sourceCss);
    if (sourcePhoto) {
      await putPhoto(
        photoKey(targetKey),
        Buffer.from(sourcePhoto.slice("data:image/jpeg;base64,".length), "base64"),
      );
    }

    const { data: saved, error: syncError } = await supabase
      .from("projects")
      .update({
        s3_key: targetKey,
        s3_etag: etag,
        synced_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("user_id", user.id)
      .select("id,name,view,csv,css,theme_id,updated_at")
      .single();
    if (syncError) throw syncError;
    return Response.json(toApi(saved), { status: 201 });
  } catch (e) {
    console.error("project duplicate: copied files could not be saved", e);
    const { error: cleanupError } = await supabase
      .from("projects")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", user.id);
    if (cleanupError) console.error("project duplicate: cleanup failed", cleanupError);
    return Response.json({ error: "Could not duplicate project files" }, { status: 502 });
  }
}