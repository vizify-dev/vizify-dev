import { BAR } from "./tools/bar";
import { SCRIPT } from "./tools/script";

/** Fills the toolbar slots in the standalone table document. */
export function withTools(html: string, title?: string): string {
  const safeTitle = (title ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
  const bar = BAR.replace("<!-- TOOL_TITLE -->", safeTitle);
  return html
    .replace("<!-- TOOLBAR -->", () => bar)
    .replace("<!-- TOOLBAR_SCRIPT -->", () => SCRIPT);
}
