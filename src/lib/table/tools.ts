import { BAR } from "@/lib/table/tools/bar";
import { SCRIPT } from "@/lib/table/tools/script";

/** Inject toolbar after <body> and script before </body>. */
export function withTools(html: string, title?: string): string {
  const attr = (title ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return html
    .replace(/<body[^>]*>/i, (m) => m + BAR.replace('id="vz-title"', `id="vz-title" data-t="${attr}"`))
    .replace(/<\/body>/i, () => SCRIPT + "</body>");
}
