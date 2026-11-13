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

const IMAGE_HEADERS = /^(photo|image|avatar|picture)$/i;
const IMAGE_SRC = /^(https?:\/\/|data:image\/(png|jpe?g|gif|webp|avif);base64,)/i;

function cellContent(value: string, column: string): string {
  const v = value.trim();
  if (IMAGE_HEADERS.test(column.trim()) && IMAGE_SRC.test(v)) {
    return `<img src="${escapeHtml(v)}" alt="" loading="lazy" referrerpolicy="no-referrer">`;
  }
  return escapeHtml(value);
}

/** Converts raw CSV into a semantic HTML table. The first row becomes the header. */
export function csvToHtmlTable(csv: string): string {
  const rows = parseCsv(csv);
  if (rows.length === 0) return "";

  const [header, ...body] = rows;
  const cols = Math.max(...rows.map((row) => row.length));
  const pad = (row: string[]) => [...row, ...Array<string>(cols - row.length).fill("")];

  const paddedHeader = pad(header);
  const headers = paddedHeader
    .map((value) =>
      replaceToken(
        HEADER_CELL_TEMPLATE.trim(),
        "<!-- CELL_CONTENT -->",
        escapeHtml(value).replace(/_/g, () => HEADER_BREAK.trim()),
      ),
    )
    .join("");
  const tableRows = body
    .map((row) =>
      replaceToken(
        ROW_TEMPLATE.trim(),
        "<!-- ROW_CELLS -->",
        pad(row)
          .map((value, i) =>
            replaceToken(
              DATA_CELL_TEMPLATE.trim(),
              "<!-- CELL_CONTENT -->",
              cellContent(value, paddedHeader[i]),
            ),
          )
          .join(""),
      ),
    )
    .join("");

  return replaceToken(TABLE_TEMPLATE.trim(), "<!-- TABLE_HEADERS -->", headers).replace(
    "<!-- TABLE_ROWS -->",
    () => tableRows,
  );
}