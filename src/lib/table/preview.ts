import { csvToHtmlTable } from "@/lib/csv";
import DOCUMENT_HTML from "./preview/document.html";
import DOCUMENT_CSS from "./preview/document.css?raw";

/** Builds a standalone HTML document: the CSV rendered as a table, styled by the user's CSS. */
export function buildDocument(csv: string, css: string): string {
  const safeCss = css.replace(/<\/style/gi, "<\\/style");
  const documentCss = DOCUMENT_CSS.replace("/* USER_CSS */", () => safeCss);

  return DOCUMENT_HTML
    .replace("<!-- DOCUMENT_CSS -->", () => documentCss)
    .replace("<!-- CSV_TABLE -->", () => csvToHtmlTable(csv));
}
