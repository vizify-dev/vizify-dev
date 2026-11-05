const MAX = 480; // px on the longest side; keeps the stored image small

/** Resizes an image file in the browser and returns a JPEG data URL. */
export async function fileToPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Not an image");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = "#fff"; // transparent PNGs become white instead of black
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}