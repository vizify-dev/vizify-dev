import { parseCsv } from "@/lib/csv";
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
  const rows = parseCsv(csv);
  if (rows.length === 0) return "";

  const [header, ...body] = rows;
  const cols = Math.max(...rows.map((row) => row.length));
  const pad = (row: string[]) => [...row, ...Array<string>(cols - row.length).fill("")];

  const headers = pad(header)
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
          .map((value) =>
            replaceToken(DATA_CELL_TEMPLATE.trim(), "<!-- CELL_CONTENT -->", escapeHtml(value)),
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
