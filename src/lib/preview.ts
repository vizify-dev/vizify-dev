import { csvToHtmlTable } from "@/lib/csv";

const FONTS_LINK =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&display=swap">';
// Keeps any theme's table inside its container: equal columns, text wraps instead of overflowing.

// Wide data scrolls sideways inside the page instead of spilling out; words never break mid-word.
const FIT =
  ".vz-scroll{overflow-x:auto;max-width:100%}" +
  "th,td{overflow-wrap:normal;word-break:normal}";



/** Builds a standalone HTML document: the CSV rendered as a table, styled by the user's CSS. */
export function buildDocument(csv: string, css: string): string {
  const safeCss = css.replace(/<\/style/gi, "<\\/style");
  
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS_LINK}<style>body{margin:0;padding:40px;background:#fff;color:#1f2837;font-family:"Hanken Grotesk",system-ui,sans-serif}</style><style>${safeCss}</style><style>${FIT}</style></head><body>${csvToHtmlTable(csv)}</body></html>`;
}

