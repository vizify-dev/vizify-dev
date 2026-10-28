import { csvToHtmlTable } from "@/lib/csv";
import BASE_CSS from "./preview/base.css";
import DOCUMENT_HTML from "./preview/document.html";
import INTERACTIVE_CSS from "./preview/interactive.css";
import { INTERACTIVE_SCRIPT } from "./preview/interactive.runtime.js";
import PRINT_CSS from "./preview/print.css";


const FONTS_LINK =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&display=swap">';

function replace(template: string, token: string, value: string): string {
  return template.replace(token, () => value);
}

/**
 * Builds a standalone HTML document: the CSV rendered as a table, styled by the user's CSS.
 * interactive=false gives a static copy (all rows, no script), used for PDF export.
 */

export function buildDocument(csv: string, css: string, interactive = true): string {
  const safeCss = css.replace(/<\/style/gi, "<\\/style");
  const values: Record<string, string> = {
    "<!-- FONTS_LINK -->": FONTS_LINK,
    "/* BASE_CSS */": BASE_CSS,
    "<!-- INTERACTIVE_STYLE -->": interactive ? `<style>${INTERACTIVE_CSS}</style>` : "",
    "/* THEME_CSS */": safeCss,
    "<!-- PRINT_STYLE -->": interactive ? "" : `<style>${PRINT_CSS}</style>`,
    "<!-- TABLE -->": csvToHtmlTable(csv),
    "<!-- SCRIPT -->": interactive ? `<script>${INTERACTIVE_SCRIPT}</script>` : "",
  };
  return Object.entries(values).reduce(
    (document, [token, value]) => replace(document, token, value),
    DOCUMENT_HTML,
  );
}