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
  web: '<circle cx="8" cy="8" r="6"/><path d="M2.5 6h11M2.5 10h11M8 2a10 10 0 0 1 0 12M8 2a10 10 0 0 0 0 12"/>',
};

function icon(kind: keyof typeof ICONS) {
  return `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[kind]}</svg>`;
}

function contactKind(v: string): keyof typeof ICONS {
  if (v.includes("@")) return "mail";
  if (/^[+\d(][\d\s().+-]{5,}$/.test(v)) return "phone";
  if (/^(https?:\/\/|www\.)/i.test(v)) return "web";
  return "pin";
}

/** "Languages: English" -> bold label. */
function rich(s: string) {
  const m = /^([^:]{2,30}):\s+(.*)$/.exec(s);
  return m ? `<strong>${esc(m[1])}:</strong> ${esc(m[2])}` : esc(s);
}

function languageLevel(value: string): { name: string; score: number | null } {
  const scored = /^(.*?)\s+(\d{1,3})%$/.exec(value);
  if (scored) return { name: scored[1], score: Number(scored[2]) };

  const proficiency = /^(.*?)\s*\(([^()]*)\)$/.exec(value);
  const level = proficiency?.[2].trim().toLowerCase();
  const scores: Record<string, number> = {
    native: 100,
    fluent: 90,
    advanced: 80,
    "upper-intermediate": 75,
    intermediate: 65,
    conversational: 60,
    elementary: 45,
    basic: 40,
    beginner: 25,
  };
  return {
    name: proficiency?.[1].trim() ?? value,
    score: level ? (scores[level] ?? null) : null,
  };
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

type ResumeLayout = "graphic" | "sidebar" | "uiux";

function renderSection(name: string, rows: Row[], layout?: ResumeLayout): string {
  const kind = kindOf(name);
  const items = rows.flatMap((r) => split(r.details));
  let body: string;
  if (rows.some((r) => r.title)) {
    body = rows.map((r) => entry(r, kind === "references" ? rich : esc)).join("");
  } else if (kind === "about") {
    body = rows.map((r) => `<p class="r-text">${esc(r.details)}</p>`).join("");
  } else if (kind === "skills") {
    body = `<ul class="r-skills">${items.map((i) => {
      const match = /^(.*?)\s+(\d{1,3})%$/.exec(i);
      return layout === "graphic" && match
        ? `<li class="r-bar"><span>${esc(match[1])}</span><b>${match[2]}%</b></li>`
        : `<li>${esc(i)}</li>`;
    }).join("")}</ul>`;
  } else if (kind === "languages" && layout === "graphic") {
    body = `<ul class="r-langs">${items.map((i) => {
      const { name, score } = languageLevel(i);
      return `<li class="r-ring"><span>${esc(name)}</span><b style="--p:${score ?? 0}">${score === null ? "" : `${score}%`}</b></li>`;
    }).join("")}</ul>`;
  } else if (rows.length === 1 && items.length === 1 && kind !== "languages") {
    body = `<p class="r-text">${esc(rows[0].details)}</p>`;
  } else {
    body = `<ul class="r-list">${items.map((i) => `<li>${rich(i)}</li>`).join("")}</ul>`;
  }
  return `<section class="r-sec" data-s="${kind}"><h2>${esc(name)}</h2>${body}</section>`;
}

/** CSV rows -> resume HTML. Every cell value is escaped. */
export function resumeToHtml(csv: string, photoOverride = "", layout?: ResumeLayout): string {
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
  const displayName = layout === "graphic" && name.includes(" ")
    ? name.trim().replace(/^(.+?)\s+(\S+)$/, (_match, first: string, last: string) =>
        `<span class="r-first">${esc(first)}</span><span class="r-last">${esc(last)}</span>`,
      )
    : esc(name);
  const head =
    `<header class="r-head">` +
    (shownPhoto ? `<img class="r-photo" src="${esc(shownPhoto)}" alt="" referrerpolicy="no-referrer">` : "") +
    `<div class="r-id">${name ? `<h1>${displayName}</h1>` : ""}${role ? `<p class="r-role">${esc(role)}</p>` : ""}</div>` +
    (items ? `<ul class="r-contact">${items}</ul>` : "") +
    `</header>`;
  const contactSec = items
    ? `<section class="r-sec" data-s="contact"><h2>${esc(contactName)}</h2><ul class="r-clist">${items}</ul></section>`
    : "";

  const renderedSections = [...sections].map(([n, rs]) => ({
    kind: kindOf(n),
    html: renderSection(n, rs, layout),
  }));
  if (layout === "uiux") {
    const body = renderedSections.map(({ html }) => html).join("");
    const decoratedHead = head.replace(
      "</header>",
      `<div class="r-uiux-stickers" aria-hidden="true">
        <span class="r-sticker r-airplane">✈️</span>
        <span class="r-sticker r-cap">🎓</span>
        <span class="r-sticker r-leaf">🌿</span>
        <span class="r-sticker r-eyes">👀</span>
        <span class="r-sticker r-tongue">👅</span>
        <span class="r-sticker r-bubble">💬</span>
        <span class="r-sticker r-resume">Resume</span>
        <span class="r-sticker r-creative">Creative</span>
        <span class="r-sticker r-btech">B.Tech</span>
        <span class="r-sticker r-date">30.06.2001</span>
        <span class="r-sticker r-confetti">✦ ✧ ✦</span>
        <span class="r-sticker r-ribbon r-ribbon-blue">〰</span>
        <span class="r-sticker r-ribbon r-ribbon-pink">〰</span>
      </div></header>`,
    );
    const socials = `<div class="r-uiux-socials" aria-hidden="true">
      <span class="r-social-behance">Be</span><span class="r-social-dribbble">◉</span>
      <span class="r-social-linkedin">in</span><span class="r-social-gmail">M</span>
      <span class="r-social-instagram">◎</span><span class="r-social-figma">●</span>
      <span class="r-social-pinterest">P</span>
    </div>`;
    return `<article class="resume resume--uiux">${decoratedHead}<div class="r-uiux-grid">${contactSec}${body}</div>${socials}</article>`;
  }
  if (layout === "graphic") {
    const about = renderedSections.filter(({ kind }) => kind === "about").map(({ html }) => html).join("");
    const sidebar = renderedSections
      .filter(({ kind }) => ["education", "skills", "languages"].includes(kind))
      .map(({ html }) => html)
      .join("");
    const main = renderedSections
      .filter(({ kind }) => !["about", "education", "skills", "languages"].includes(kind))
      .map(({ html }) => html)
      .join("");
    return `<article class="resume resume--graphic">${head}${about}<aside class="r-side">${sidebar}${contactSec}</aside><div class="r-main">${main}</div></article>`;
  }
  if (layout === "sidebar") {
  const sidebar = renderedSections
    .filter(({ kind }) => ["education", "skills", "languages"].includes(kind))
    .map(({ html }) => html)
    .join("");
  const main = renderedSections
    .filter(({ kind }) => !["education", "skills", "languages"].includes(kind))
    .map(({ html }) => html)
    .join("");
  return `<article class="resume">${head}<div class="r-body"><aside class="r-side">${contactSec}${sidebar}</aside><div class="r-main">${main}</div></div></article>`;
  }
  const body = renderedSections.map(({ html }) => html).join("");
  return `<article class="resume">${head}<div class="r-body">${contactSec}${body}</div></article>`;
}

const FONTS_LINK =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Open+Sans:wght@400;600;700&display=swap">';

/** Standalone resume document. No script, so it's also used as-is for PDF export. */
export function buildResumeDocument(csv: string, css: string, photo = "", layout?: ResumeLayout): string {
  const safeCss = css.replace(/<\/style/gi, "<\\/style");
  // Defaults before the theme CSS: the sidebar contact list and the photo are opt-in per theme.
  const base =
    `*{box-sizing:border-box}body{margin:0;padding:${layout === "uiux" ? "0" : "32px 16px"};background:${layout === "uiux" ? "#fff" : "#eef1f6"};-webkit-print-color-adjust:exact;print-color-adjust:exact}` +
    '.r-sec[data-s="contact"],.r-photo{display:none}.r-side,.r-main{display:contents}.r-error{font:14px system-ui,sans-serif;color:#b42318}' +
    "@page{size:A4 portrait;margin:0}@media print{body{padding:0;background:#fff}}";
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS_LINK}<style>${base}</style><style>${safeCss}</style></head><body>${resumeToHtml(csv, photo, layout)}</body></html>`;
}