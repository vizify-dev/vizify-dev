import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION! });
const Bucket = process.env.S3_BUCKET!;

export const csvKey = (uid: string, pid: string) => `users/${uid}/${pid}.csv`;

function isMissingS3Object(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  if ("name" in error && error.name === "NotFound") return true;
  if ("$metadata" in error) {
    const metadata = error.$metadata;
    if (
      typeof metadata === "object" &&
      metadata !== null &&
      "httpStatusCode" in metadata &&
      metadata.httpStatusCode === 404
    ) return true;
  }

  return false;
}

export async function putCsv(Key: string, text: string) {
  const r = await s3.send(new PutObjectCommand({
    Bucket, Key, Body: text, ContentType: "text/csv; charset=utf-8",
  }));
  return r.ETag!;
}

export async function headCsv(Key: string): Promise<string | null> {
  try {
    const r = await s3.send(new HeadObjectCommand({ Bucket, Key }));
    return r.ETag ?? null;
  } catch (e: unknown) {
    if (isMissingS3Object(e)) return null;
    throw e;
  }
}

export async function getCsv(Key: string) {
  const r = await s3.send(new GetObjectCommand({ Bucket, Key }));
  return { text: await r.Body!.transformToString(), etag: r.ETag! };
}