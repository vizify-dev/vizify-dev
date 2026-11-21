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

const TODO_LIGHT_PRINT_CSS = `
.cssv-scroll td:first-child {
  display: table-cell !important;
  position: static !important;
  padding-left: 18px !important;
}

.cssv-scroll td:first-child::before {
  content: none !important;
  display: none !important;
}

.cssv-scroll td:first-child .cssv-first-cell {
  box-sizing: border-box;
  display: grid !important;
  grid-template-columns: 17px minmax(0, 1fr);
  align-items: start;
  gap: 11px;
  width: 100%;
}

.cssv-scroll td:first-child .cssv-row-checkbox {
  box-sizing: border-box;
  display: grid !important;
  place-items: center;
  width: 17px;
  height: 17px;
  margin-top: 1px;
  border: 1.5px solid #cbd4e3;
  border-radius: 5px;
  background: #fff;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
}

.cssv-scroll td:first-child .cssv-cell {
  display: block !important;
  width: auto !important;
  min-width: 0 !important;
  max-width: 100% !important;
  white-space: normal !important;
  overflow-wrap: anywhere !important;
}
`;

function replace(template: string, token: string, value: string): string {
  return template.replace(token, () => value);
}

/**
 * Builds a standalone HTML document: the CSV rendered as a table, styled by the user's CSS.
 * interactive=false gives a static copy (all rows, no script), used for PDF export.
 */

export function buildDocument(csv: string, css: string, interactive = true): string {
  const isTodoLightTheme = /--vz-title:\s*["']My tasks["']/.test(css);
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
    "/* PRINT_CSS */": interactive
      ? ""
      : `${PRINT_CSS}${isTodoLightTheme ? TODO_LIGHT_PRINT_CSS : ""}`,
    "<!-- TABLE -->": csvToHtmlTable(csv, interactive),
    "<!-- SCRIPT -->": interactive ? INTERACTIVE_SCRIPT : "",
  };
  return Object.entries(values).reduce(
    (document, [token, value]) => replace(document, token, value),
    DOCUMENT_HTML,
  );
}