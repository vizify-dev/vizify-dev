import { csvToHtmlTable } from "@/lib/csv";

const FONTS_LINK =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&display=swap">';

/** Builds a standalone HTML document: the CSV rendered as a table, styled by the user's CSS. */
export function buildDocument(csv: string, css: string): string {
  const safeCss = css.replace(/<\/style/gi, "<\\/style");
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS_LINK}<style>body{margin:0;padding:40px;background:#fff;color:#1f2837;font-family:"Hanken Grotesk",system-ui,sans-serif}</style><style>${safeCss}</style></head><body>${csvToHtmlTable(csv)}</body></html>`;
}
