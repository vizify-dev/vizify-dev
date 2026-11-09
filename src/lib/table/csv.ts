import { parseCsv } from "@/lib/csv-parser";
import TABLE_TEMPLATE from "./preview/table.html";
import HEADER_CELL_TEMPLATE from "./preview/header-cell.html";
import ROW_TEMPLATE from "./preview/row.html";
import DATA_CELL_TEMPLATE from "./preview/data-cell.html";
import HEADER_BREAK from "./preview/header-break.html";

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

function replaceToken(template: string, token: string, value: string): string {
  return template.replace(token, () => value);
}

/** Converts raw CSV into a semantic HTML table. The first row becomes the header. */
export function csvToHtmlTable(csv: string): string {
  const rows = parseCsv(csv, "auto");
  if (rows.length === 0) {
    return '<div class="cssv-empty" role="status">No data yet. Upload a CSV to get started.</div>';
  }

  const [header, ...body] = rows;
  const cols = Math.max(...rows.map((row) => row.length));
  const pad = (row: string[]) => [...row, ...Array<string>(cols - row.length).fill("")];

  const headers = pad(header)
    .map((value, index) =>
      replaceToken(
        HEADER_CELL_TEMPLATE.trim(),
        "<!-- CELL_CONTENT -->",
        escapeHtml(value.trim() ? value : `Column ${index + 1}`).replace(
          /_/g,
          () => HEADER_BREAK.trim(),
        ),
      ),
    )
    .join("");
  const tableRows = body
    .map((row) =>
      replaceToken(
        ROW_TEMPLATE.trim(),
        "<!-- ROW_CELLS -->",
        pad(row)
          .map((value) => {
            const content = value
              ? `<button class="cssv-cell" type="button" aria-expanded="false" title="Show full cell text">${escapeHtml(value)}</button>`
              : "";
            return replaceToken(DATA_CELL_TEMPLATE.trim(), "<!-- CELL_CONTENT -->", content);
          })
          .join(""),
      ),
    )
    .join("");

  const table = replaceToken(TABLE_TEMPLATE.trim(), "<!-- TABLE_HEADERS -->", headers).replace(
    "<!-- TABLE_ROWS -->",
    () => tableRows,
  );
  return body.length === 0
    ? `${table}<div class="cssv-empty" role="status">Header only: no data rows found.</div>`
    : table;
}
