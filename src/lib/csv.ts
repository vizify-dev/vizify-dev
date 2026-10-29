import TABLE_TEMPLATE from "@/lib/table/preview/table.html";
import HEADER_CELL_TEMPLATE from "@/lib/table/preview/header-cell.html";
import ROW_TEMPLATE from "@/lib/table/preview/row.html";
import DATA_CELL_TEMPLATE from "@/lib/table/preview/data-cell.html";
import HEADER_BREAK from "@/lib/table/preview/header-break.html";

/** Parses CSV text into rows of fields. Handles quoted fields, "" escapes, and CRLF/LF. */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop fully blank lines.
  return rows.filter((r) => r.length > 1 || r[0].trim() !== "");
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

function replaceToken(template: string, token: string, value: string): string {
  return template.replace(token, () => value);
}

/** Converts raw CSV into a semantic HTML table. The first row becomes the header. */
export function csvToHtmlTable(csv: string): string {
  const rows = parseCsv(csv);
  if (rows.length === 0) return "";

  const [header, ...body] = rows;
  const cols = Math.max(...rows.map((r) => r.length));
  const pad = (r: string[]) => [...r, ...Array<string>(cols - r.length).fill("")];

  const th = pad(header)
    .map((c) =>
      replaceToken(
        HEADER_CELL_TEMPLATE.trim(),
        "<!-- CELL_CONTENT -->",
        escapeHtml(c).replace(/_/g, () => HEADER_BREAK.trim()),
      ),
    )
    .join("");
  const trs = body
    .map((r) =>
      replaceToken(
        ROW_TEMPLATE.trim(),
        "<!-- ROW_CELLS -->",
        pad(r)
          .map((c) =>
            replaceToken(DATA_CELL_TEMPLATE.trim(), "<!-- CELL_CONTENT -->", escapeHtml(c)),
          )
          .join(""),
      ),
    )
    .join("");

  return replaceToken(TABLE_TEMPLATE.trim(), "<!-- TABLE_HEADERS -->", th).replace(
    "<!-- TABLE_ROWS -->",
    () => trs,
  );
}
