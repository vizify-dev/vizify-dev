import { parseCsv } from "@/lib/csv-parser";
import { escapeHtml as esc } from "@/lib/html";
import { buildDocument } from "@/lib/table/preview";
import { LEGACY_CARD_THEME_IDS } from "./themes";

import DOCUMENT_HTML from "./templates/document.html";
import SHEET_HTML from "./templates/sheet.html";
import TOOLBAR_HTML from "./templates/toolbar.html";
import CARD_HTML from "./templates/card.html";
import PHOTO_HTML from "./templates/photo.html";
import META_ROW_HTML from "./templates/meta-row.html";
import FOOT_HTML from "./templates/foot.html";
import ERROR_HTML from "./templates/error.html";
import INTERACTIVE_CSS from "./styles/interactive.css?raw";
import PRINT_CSS from "./styles/print.css?raw";
import SCRIPT_HTML from "./runtime/cards.script.html";
import RUNTIME from "./runtime/cards.runtime.generated.txt";

const SCRIPT = SCRIPT_HTML.replace("/* CARDS_RUNTIME */", () => RUNTIME);
const LEGACY_PRINT_CSS = `
@media print {
  body { padding: 0 }
  tbody { gap: 8mm }
  tr { break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact }
}`;
const LEGACY_COLUMNS = [
  ["photo", "image", "avatar", "picture"],
  ["name", "full name", "student name", "employee name"],
  ["role", "title", "designation", "position", "job title"],
  ["company", "organization", "organisation", "school", "institute", "college", "event"],
  ["tagline", "department", "dept", "class", "team", "batch"],
  ["website", "web site", "url"],
  ["id", "employee id", "emp id", "roll no", "roll number", "member id", "badge id"],
  ["expires", "valid till", "valid until", "expiry", "valid thru"],
  ["phone", "mobile", "contact", "phone number"],
  ["email", "e-mail", "email address"],
] as const;
const LEGACY_HEADERS = [
  "Photo",
  "Name",
  "Role",
  "Company",
  "Tagline",
  "Website",
  "ID",
  "Expires",
  "Phone",
  "Email",
];

/** Header aliases (lowercase) for each field. */
const ALIASES = {
  name: ["name", "full name", "student name", "employee name"],
  role: ["title", "role", "designation", "position", "job title"],
  org: ["company", "organization", "organisation", "school", "institute", "college", "event"],
  idno: ["id", "employee id", "emp id", "roll no", "roll number", "member id", "badge id"],
  dept: ["department", "dept", "class", "team", "batch"],
  email: ["email", "e-mail", "email address"],
  phone: ["phone", "mobile", "contact", "phone number"],
  valid: ["valid till", "valid until", "expiry", "expires", "valid thru"],
  photo: ["photo", "image", "avatar", "photo url", "picture"],
} as const;

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (html, [token, value]) => html.replace(`<!-- ${token} -->`, () => value),
    template.trim(),
  );
}

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/** Only plain web images and data URLs; anything else (javascript:, file:) is dropped. */
const safeImage = (url: string) => (/^(https?:\/\/|data:image\/)/i.test(url) ? url : "");

export function renderCards(rows: string[][], interactive = true): { body: string } {
  const [header = [], ...data] = rows;
  const names = header.map((h) => h.trim().toLowerCase());
  const col = (aliases: readonly string[]) => names.findIndex((n) => aliases.includes(n));
  const idx = Object.fromEntries(
    Object.entries(ALIASES).map(([field, aliases]) => [field, col(aliases)]),
  ) as Record<keyof typeof ALIASES, number>;

  if (idx.name < 0) {
    return { body: fill(ERROR_HTML, { FOUND: esc(header.join(", ") || "none") }) };
  }

  const get = (r: string[], i: number) => (i < 0 ? "" : (r[i] ?? "").trim());
  const people = data.filter((r) => get(r, idx.name) !== "");

  const cards = people
    .map((r) => {
      const name = get(r, idx.name);
      const photo = safeImage(get(r, idx.photo));
      const meta = (
        [
          ["Dept", get(r, idx.dept)],
          ["Email", get(r, idx.email)],
          ["Phone", get(r, idx.phone)],
        ] as const
      )
        .filter(([, v]) => v)
        .map(([label, value]) => fill(META_ROW_HTML, { LABEL: label, VALUE: esc(value) }))
        .join("");
      const idno = get(r, idx.idno);
      const valid = get(r, idx.valid);
      return fill(CARD_HTML, {
        ORG: esc(get(r, idx.org)),
        INITIALS: esc(initials(name)),
        PHOTO: photo ? fill(PHOTO_HTML, { SRC: esc(photo) }) : "",
        NAME: esc(name),
        ROLE: esc(get(r, idx.role)),
        META: meta,
        FOOT:
          idno || valid
            ? fill(FOOT_HTML, { IDNO: esc(idno), VALID: valid ? esc(`Valid ${valid}`) : "" })
            : "",
      });
    })
    .join("");

  return {
    body: fill(SHEET_HTML, {
      COUNT: String(people.length),
      TOOLBAR: interactive ? TOOLBAR_HTML.trim() : "",
      CARDS: cards,
    }),
  };
}

/** Standalone ID-card sheet styled by the editor CSS. interactive=false drops the script (PDF). */
export function buildCardsDocument(
  csv: string,
  css: string,
  interactive = true,
  themeId?: string,
): string {
  const hasLegacyLayout =
    LEGACY_CARD_THEME_IDS.includes(themeId ?? "") ||
    css.includes("/* Columns: Photo, Name, Role, Company");
  if (hasLegacyLayout) {
    const [headers = [], ...rows] = parseCsv(csv);
    const names = headers.map((header) => header.trim().toLowerCase());
    const indexes = LEGACY_COLUMNS.map((aliases) =>
      names.findIndex((header) => aliases.some((alias) => alias === header)),
    );
    if (indexes[1] >= 0) {
      const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
      const normalizedCsv = [
        LEGACY_HEADERS,
        ...rows.map((row) => indexes.map((index) => (index < 0 ? "" : row[index] ?? ""))),
      ]
        .map((row) => row.map(quote).join(","))
        .join("\n");
      return buildDocument(
        normalizedCsv,
        `${css}\n${LEGACY_PRINT_CSS}`,
        interactive,
      );
    }
  }

  const { body } = renderCards(parseCsv(csv), interactive);
  const values: Record<string, string> = {
    "/* THEME_CSS */": css.replace(/<\/style/gi, "<\\/style"),
    "/* INTERACTIVE_CSS */": interactive ? INTERACTIVE_CSS : "",
    "/* PRINT_CSS */": PRINT_CSS,
    "<!-- BODY -->": body,
    "<!-- SCRIPT -->": interactive ? SCRIPT : "",
  };
  return Object.entries(values).reduce(
    (doc, [token, value]) => doc.replace(token, () => value),
    DOCUMENT_HTML,
  );
}
