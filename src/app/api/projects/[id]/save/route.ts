import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/session";
import { canUseTheme } from "@/lib/plans";
import { toApi, VIEWS } from "@/lib/projects";
import {
  cssKey,
  csvKey,
  deletePhoto,
  getCss,
  headCsv,
  photoKey,
  putCss,
  putCsv,
  putPhoto,
} from "@/lib/s3";

type Ctx = { params: Promise<{ id: string }> };
const SaveInput = z.object({
  view: z.enum(VIEWS),
  csv: z.string().max(1_000_000),
  css: z.string().max(500_000),
  themeId: z.string().max(50).nullable().optional(),
  expectedUpdatedAt: z.string().trim().min(1).max(100),
  photo: z.string().max(2_000_000).optional(),
  overwrite: z.boolean().optional(),
});
const COLS = "id,name,view,csv,css,theme_id,updated_at,s3_key,s3_etag";

export async function POST(req: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const parsed = SaveInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    console.error("project save: invalid input", parsed.error.flatten());
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }
  const input = parsed.data;

  if (input.photo !== undefined && input.photo !== "" &&
      !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(input.photo)) {
    return Response.json({ error: "Invalid photo" }, { status: 400 });
  }
  if (input.themeId !== undefined && !canUseTheme(user.plan, input.themeId))
    return Response.json({ error: "Premium theme" }, { status: 403 });

  const supabase = await createClient();
  const { data: project, error: lookupError } = await supabase
    .from("projects")
    .select(COLS)
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (lookupError) {
    console.error("project save: lookup failed", lookupError);
    return Response.json({ error: "Could not save project" }, { status: 500 });
  }
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });
  if (project.view !== input.view) {
    return Response.json({ error: "Project type changed" }, { status: 409 });
  }
  if (project.updated_at !== input.expectedUpdatedAt) {
    return Response.json(
      {
        error: "This resume changed elsewhere.",
        updatedAt: project.updated_at,
        etag: project.s3_etag,
      },
      { status: 409 },
    );
  }

  const key = project.s3_key ?? csvKey(user.id, id);
  try {
    const [remoteEtag, remoteCss] = await Promise.all([
      headCsv(key),
      getCss(cssKey(key)),
    ]);
    if (
      (remoteEtag !== project.s3_etag || (remoteCss !== null && remoteCss !== project.css)) &&
      !input.overwrite
    ) {
      return Response.json(
        {
          error: "This resume changed elsewhere.",
          updatedAt: project.updated_at,
          etag: remoteEtag,
        },
        { status: 409 },
      );
    }
  } catch (e) {
    console.error("project save: S3 version check failed", e);
    return Response.json({ error: "Could not verify project version" }, { status: 502 });
  }

  const claimTime = new Date().toISOString();
  const { data: claimed, error: claimError } = await supabase
    .from("projects")
    .update({ updated_at: claimTime })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("updated_at", input.expectedUpdatedAt)
    .is("deleted_at", null)
    .select("updated_at")
    .maybeSingle();
  if (claimError) {
    console.error("project save: version claim failed", claimError);
    return Response.json({ error: "Could not save project" }, { status: 500 });
  }
  if (!claimed) {
    const { data: current } = await supabase
      .from("projects")
      .select("updated_at,s3_etag")
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();
    return Response.json(
      {
        error: "This resume changed elsewhere.",
        updatedAt: current?.updated_at,
        etag: current?.s3_etag,
      },
      { status: current ? 409 : 404 },
    );
  }

  try {
    const etag = await putCsv(key, input.csv);
    await putCss(cssKey(key), input.css);
    if (input.photo !== undefined) {
      if (input.photo) {
        const base64 = input.photo.slice("data:image/jpeg;base64,".length);
        await putPhoto(photoKey(key), Buffer.from(base64, "base64"));
      } else {
        await deletePhoto(photoKey(key));
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from("projects")
      .update({
        csv: input.csv,
        css: input.css,
        theme_id: input.themeId ?? null,
        s3_key: key,
        s3_etag: etag,
        synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("updated_at", claimed.updated_at)
      .is("deleted_at", null)
      .select(COLS)
      .maybeSingle();
    if (updateError) {
      console.error("project save: database update failed", updateError);
      return Response.json({ error: "Could not save project" }, { status: 500 });
    }
    if (!updated) {
      return Response.json({ error: "This resume changed elsewhere." }, { status: 409 });
    }
    return Response.json({ ...toApi(updated), etag });
  } catch (e) {
    console.error("project save: S3 write failed", e);
    return Response.json({ error: "Could not save project files" }, { status: 502 });
  }
}
