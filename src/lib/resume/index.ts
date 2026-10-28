import { parseCsv } from "@/lib/csv";

const COLS = ["section", "title", "subtitle", "date", "details"] as const;
type Col = (typeof COLS)[number];
type Row = Record<Col, string>;

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);
const split = (s: string) => s.split("|").map((x) => x.trim()).filter(Boolean);
const safeSrc = (u: string) => (/^(https:\/\/|data:image\/)/i.test(u) ? u : "");

// Section names map to a "kind" so themes can place sections whatever the user calls them.
const KINDS: [string, RegExp][] = [
  ["about", /about|summary|profile|objective/],
  ["experience", /experience|employment|work/],
  ["education", /education|academic/],
  ["skills", /skill/],
  ["languages", /language/],
  ["references", /reference/],
];
const kindOf = (name: string) => KINDS.find(([, re]) => re.test(name.toLowerCase()))?.[0] ?? "other";

const ICONS = {
  phone: '<path d="M3.5 2h2.5l1 3-1.5 1a8 8 0 0 0 3.5 3.5L10 8l3 1v2.5a1.5 1.5 0 0 1-1.5 1.5A10 10 0 0 1 2 3.5 1.5 1.5 0 0 1 3.5 2Z"/>',
  mail: '<rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="m2.5 5 5.5 4 5.5-4"/>',
  pin: '<path d="M8 14s4.5-4 4.5-7.5a4.5 4.5 0 0 0-9 0C3.5 10 8 14 8 14Z"/><circle cx="8" cy="6.5" r="1.5"/>',
};

function icon(kind: keyof typeof ICONS) {
  return `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[kind]}</svg>`;
}

function contactKind(v: string): keyof typeof ICONS {
  if (v.includes("@")) return "mail";
  if (/^[+\d(][\d\s().+-]{5,}$/.test(v)) return "phone";
  return "pin";
}

/** "Languages: English" -> bold label. */
function rich(s: string) {
  const m = /^([^:]{2,30}):\s+(.*)$/.exec(s);
  return m ? `<strong>${esc(m[1])}:</strong> ${esc(m[2])}` : esc(s);
}

function readRows(csv: string): { rows: Row[]; missing: string[] } {
  const table = parseCsv(csv);
  if (table.length === 0) return { rows: [], missing: [] };
  const head = table[0].map((h) => h.trim().toLowerCase());
  const at = (c: Col) => head.indexOf(c);
  if (at("section") < 0) return { rows: [], missing: ["section"] };
  const rows = table.slice(1).map(
    (r) => Object.fromEntries(COLS.map((c) => [c, at(c) < 0 ? "" : (r[at(c)] ?? "").trim()])) as Row,
  );
  return { rows, missing: [] };
}

function entry(r: Row, fmt: (s: string) => string) {
  const items = split(r.details);
  return (
    `<div class="r-entry"><div class="r-line">` +
    (r.title ? `<strong class="r-title">${esc(r.title)}</strong>` : "") +
    (r.date ? `<span class="r-date">${esc(r.date)}</span>` : "") +
    `</div>` +
    (r.subtitle ? `<div class="r-sub">${esc(r.subtitle)}</div>` : "") +
    (items.length ? `<ul class="r-bullets">${items.map((i) => `<li>${fmt(i)}</li>`).join("")}</ul>` : "") +
    `</div>`
  );
}

function renderSection(name: string, rows: Row[]): string {
  const kind = kindOf(name);
  const items = rows.flatMap((r) => split(r.details));
  let body: string;
  if (rows.some((r) => r.title)) {
    body = rows.map((r) => entry(r, kind === "references" ? rich : esc)).join("");
  } else if (kind === "about") {
    body = rows.map((r) => `<p class="r-text">${esc(r.details)}</p>`).join("");
  } else if (kind === "skills") {
    body = `<ul class="r-skills">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
  } else if (rows.length === 1 && items.length === 1 && kind !== "languages") {
    body = `<p class="r-text">${esc(rows[0].details)}</p>`;
  } else {
    body = `<ul class="r-list">${items.map((i) => `<li>${rich(i)}</li>`).join("")}</ul>`;
  }
  return `<section class="r-sec" data-s="${kind}"><h2>${esc(name)}</h2>${body}</section>`;
}

/** CSV rows -> resume HTML. Every cell value is escaped. */
export function resumeToHtml(csv: string, photoOverride = ""): string {
  const { rows, missing } = readRows(csv);
  if (missing.length) {
    return `<p class="r-error">Resume view needs columns: ${COLS.join(", ")}. Missing: ${missing.join(", ")}.</p>`;
  }
  if (rows.length === 0) return "";

  let name = "";
  let role = "";
  let photo = "";
  let contactName = "Contact";
  const contacts: string[] = [];
  const sections = new Map<string, Row[]>();

  for (const r of rows) {
    if (!r.section) continue;
    const key = r.section.toLowerCase();
    if (key === "name") {
      name = r.title || name;
      role = r.subtitle || role;
    } else if (key === "photo") {
      photo = safeSrc(r.details) || photo;
    } else if (key === "contact") {
      contactName = r.section;
      contacts.push(...split(r.details));
    } else {
      sections.set(r.section, [...(sections.get(r.section) ?? []), r]);
    }
  }
  const shownPhoto = safeSrc(photoOverride) || photo;
  const items = contacts.map((c) => `<li>${icon(contactKind(c))}<span>${esc(c)}</span></li>`).join("");
  const head =
    `<header class="r-head">` +
    (shownPhoto ? `<img class="r-photo" src="${esc(shownPhoto)}" alt="" referrerpolicy="no-referrer">` : "") +
    `<div class="r-id">${name ? `<h1>${esc(name)}</h1>` : ""}${role ? `<p class="r-role">${esc(role)}</p>` : ""}</div>` +
    (items ? `<ul class="r-contact">${items}</ul>` : "") +
    `</header>`;
  const contactSec = items
    ? `<section class="r-sec" data-s="contact"><h2>${esc(contactName)}</h2><ul class="r-clist">${items}</ul></section>`
    : "";

  const body = [...sections].map(([n, rs]) => renderSection(n, rs)).join("");
  return `<article class="resume">${head}<div class="r-body">${contactSec}${body}</div></article>`;
}

const FONTS_LINK =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Open+Sans:wght@400;600;700&display=swap">';

/** Standalone resume document. No script, so it's also used as-is for PDF export. */
export function buildResumeDocument(csv: string, css: string, photo = ""): string {
  const safeCss = css.replace(/<\/style/gi, "<\\/style");
  // Defaults before the theme CSS: the sidebar contact list and the photo are opt-in per theme.
  const base =
    "*{box-sizing:border-box}body{margin:0;padding:32px 16px;background:#eef1f6;-webkit-print-color-adjust:exact;print-color-adjust:exact}" +
    '.r-sec[data-s="contact"],.r-photo{display:none}.r-error{font:14px system-ui,sans-serif;color:#b42318}' +
    "@page{size:A4 portrait;margin:0}@media print{body{padding:0;background:#fff}}";
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS_LINK}<style>${base}</style><style>${safeCss}</style></head><body>${resumeToHtml(csv, photo)}</body></html>`;
}