import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@/lib/session";
import { csvKey, putCsv, headCsv, getCsv } from "@/lib/s3";

type Ctx = { params: Promise<{ id: string }> };
const MAX_CSV = 1_000_000;

export async function POST(req: Request, { params }: Ctx) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = (await req.json().catch(() => null)) as { csv?: unknown; baseEtag?: unknown } | null;
  const local = typeof body?.csv === "string" ? body.csv : undefined;
  const baseEtag = typeof body?.baseEtag === "string" ? body.baseEtag : null;
  if (local !== undefined && local.length > MAX_CSV)
    return Response.json({ error: "Too large" }, { status: 413 });

  const supabase = await createClient();
  const { data: p, error: pErr } = await supabase
    .from("projects")
    .select("id,csv,s3_key,s3_etag")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (pErr) {
    console.error("sync: project lookup failed", pErr);
    return Response.json({ error: "Lookup failed" }, { status: 500 });
  }
  if (!p) return Response.json({ error: "Not found" }, { status: 404 });

  const key = p.s3_key ?? csvKey(user.id, id);
  const save = async (csv: string, etag: string) => {
    const { data, error } = await supabase
      .from("projects")
      .update({
        csv,
        s3_key: key,
        s3_etag: etag,
        synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("updated_at")
      .single();
    if (error) throw error;
    return data.updated_at;
  };

  try {
    const remote = await headCsv(key);

    // 1. not in S3 yet: upload
    if (remote === null) {
      const csv = local ?? p.csv;
      const etag = await putCsv(key, csv);
      const updatedAt = await save(csv, etag);
      return Response.json({ status: "pushed", etag, updatedAt });
    }

    // 2. S3 file changed since we last saw it
    if (remote !== (baseEtag ?? p.s3_etag)) {
      const r = await getCsv(key);
      if (local !== undefined && local !== r.text)
        return Response.json({ status: "conflict", csv: r.text, etag: r.etag });
      const updatedAt = await save(r.text, r.etag);
      return Response.json({ status: "pulled", csv: r.text, etag: r.etag, updatedAt });
    }

    // 3. local edits are newer: upload
    if (local !== undefined && local !== p.csv) {
      const etag = await putCsv(key, local);
      const updatedAt = await save(local, etag);
      return Response.json({ status: "pushed", etag, updatedAt });
    }

    return Response.json({ status: "in-sync", etag: remote });
  } catch (e) {
    console.error("sync failed", e);
    return Response.json({ error: "Sync failed" }, { status: 502 });
  }
}