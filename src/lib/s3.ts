import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION! });
const Bucket = process.env.S3_BUCKET!;
if (!Bucket) throw new Error("S3_BUCKET is not set");

export const csvKey = (uid: string, pid: string) => `users/${uid}/${pid}.csv`;

type AwsError = { name?: string; Code?: string; $metadata?: { httpStatusCode?: number } };

// Only a missing FILE counts as "not found". A missing bucket must stay an error.
function isMissingS3Object(error: unknown): boolean {
  const err = error as AwsError;
  if (err.name === "NoSuchBucket" || err.Code === "NoSuchBucket") return false;
  return (
    err.name === "NotFound" ||
    err.name === "NoSuchKey" ||
    err.$metadata?.httpStatusCode === 404
  );
}

export async function putCsv(Key: string, text: string) {
  const r = await s3.send(
    new PutObjectCommand({ Bucket, Key, Body: text, ContentType: "text/csv; charset=utf-8" }),
  );
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