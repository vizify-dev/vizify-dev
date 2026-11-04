import { csvToHtmlTable } from "./csv";
import BASE_CSS from "./preview/base.css?raw";
import DOCUMENT_HTML from "./preview/document.html";
import INTERACTIVE_CSS from "./preview/interactive.css?raw";
import INTERACTIVE_SCRIPT_HTML from "./preview/interactive.script.html";
import INTERACTIVE_RUNTIME from "./preview/interactive.runtime.ts?raw";
import PRINT_CSS from "./preview/print.css?raw";

const INTERACTIVE_SCRIPT = INTERACTIVE_SCRIPT_HTML.replace(
  "/* INTERACTIVE_RUNTIME */",
  () => INTERACTIVE_RUNTIME,
);

const LEGACY_ROW_MARKER_SIGNATURES = [
  'content: "○";',
  "box-shadow: 0 0 10px #60a5fa;",
  'content: "📋";',
];

function replace(template: string, token: string, value: string): string {
  return template.replace(token, () => value);
}

/**
 * Builds a standalone HTML document: the CSV rendered as a table, styled by the user's CSS.
 * interactive=false gives a static copy (all rows, no script), used for PDF export.
 */

export function buildDocument(csv: string, css: string, interactive = true): string {
  const hasLegacyRowMarkers = LEGACY_ROW_MARKER_SIGNATURES.some((signature) =>
    css.includes(signature),
  );
  const themeCss = hasLegacyRowMarkers
    ? `${css}\n.cssv-scroll > table tbody td:first-child::before { content: none !important; display: none !important; }`
    : css;
  const safeCss = themeCss.replace(/<\/style/gi, "<\\/style");
  const values: Record<string, string> = {
    "/* BASE_CSS */": BASE_CSS,
    "/* INTERACTIVE_CSS */": interactive ? INTERACTIVE_CSS : "",
    "/* THEME_CSS */": safeCss,
    "/* PRINT_CSS */": interactive ? "" : PRINT_CSS,
    "<!-- TABLE -->": csvToHtmlTable(csv),
    "<!-- SCRIPT -->": interactive ? INTERACTIVE_SCRIPT : "",
  };
  return Object.entries(values).reduce(
    (document, [token, value]) => replace(document, token, value),
    DOCUMENT_HTML,
  );
}