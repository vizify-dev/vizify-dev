import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION! });
const Bucket = process.env.S3_BUCKET!;
if (!Bucket) throw new Error("S3_BUCKET is not set");

export const csvKey = (uid: string, pid: string) => `users/${uid}/${pid}.csv`;
export const photoKey = (key: string) =>
  /\.csv$/i.test(key) ? `${key.slice(0, -4)}.jpg` : `${key}.jpg`;
export const cssKey = (key: string) =>
  /\.csv$/i.test(key) ? `${key.slice(0, -4)}.css` : `${key}.css`;

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
  return putText(Key, text, "text/csv; charset=utf-8");
}

export async function putCss(Key: string, text: string) {
  await putText(Key, text, "text/css; charset=utf-8");
}

async function putText(Key: string, text: string, ContentType: string) {
  const r = await s3.send(
    new PutObjectCommand({ Bucket, Key, Body: text, ContentType }),
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

export async function getCss(Key: string): Promise<string | null> {
  try {
    const r = await s3.send(new GetObjectCommand({ Bucket, Key }));
    return await r.Body!.transformToString();
  } catch (e: unknown) {
    if (isMissingS3Object(e)) return null;
    throw e;
  }
}

export async function putPhoto(Key: string, body: Uint8Array) {
  await s3.send(
    new PutObjectCommand({ Bucket, Key, Body: body, ContentType: "image/jpeg" }),
  );
}

export async function getPhoto(Key: string): Promise<string | null> {
  try {
    const r = await s3.send(new GetObjectCommand({ Bucket, Key }));
    const bytes = await r.Body!.transformToByteArray();
    return `data:image/jpeg;base64,${Buffer.from(bytes).toString("base64")}`;
  } catch (e: unknown) {
    if (isMissingS3Object(e)) return null;
    throw e;
  }
}

export async function deletePhoto(Key: string) {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket, Key }));
  } catch (e: unknown) {
    if (!isMissingS3Object(e)) throw e;
  }
}