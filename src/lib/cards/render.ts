import { parseCsv } from "@/lib/csv-parser";
import { escapeHtml as esc } from "@/lib/html";
import BASE_CSS from "./styles/base.css";

const ALIASES = {
  photo: ["photo", "image", "avatar", "picture"],
  name: ["name", "full name"],
  role: ["role", "title", "designation", "position"],
  company: ["company", "organization", "organisation", "org"],
  tagline: ["tagline", "slogan"],
  website: ["website", "url", "site"],
  id: ["id", "employee id", "card id"],
  expires: ["expires", "expiry", "valid until"],
  phone: ["phone", "mobile", "tel"],
  email: ["email", "e-mail"],
} as const;

type Field = keyof typeof ALIASES;

const safeImg = (u: string) => (/^(https?:\/\/|data:image\/)/i.test(u) ? u : "");
const safeHref = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);
const initials = (n: string) =>
  n.split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();

export function renderCards(rows: string[][]): string {
  const [header = [], ...data] = rows;
  const names = header.map((h) => h.trim().toLowerCase());
  const idx = Object.fromEntries(
    Object.entries(ALIASES).map(([f, a]) => [f, names.findIndex((n) => (a as readonly string[]).includes(n))]),
  ) as Record<Field, number>;

  if (idx.name < 0) {
    return `<div class="msg"><p><b>ID Cards view needs a Name column.</b></p><small>Found: ${esc(header.join(", ") || "none")}</small></div>`;
  }

  const cards = data
    .map((r) => {
      const g = (f: Field) => (idx[f] < 0 ? "" : (r[idx[f]] ?? "").trim());
      const name = g("name");
      if (!name) return "";
      const img = safeImg(g("photo"));
      const meta = ([["ID", "id"], ["Expires", "expires"]] as [string, Field][])
        .filter(([, f]) => g(f))
        .map(([k, f]) => `<div><dt>${k}</dt><dd>${esc(g(f))}</dd></div>`)
        .join("");
      const web = g("website");
      return `<article class="idcard">
<header class="idcard-top"><span class="idcard-company">${esc(g("company"))}</span></header>
<div class="idcard-photo">${img ? `<img src="${esc(img)}" alt="${esc(name)}">` : `<span>${esc(initials(name))}</span>`}</div>
<h2 class="idcard-name">${esc(name)}</h2>
${g("role") ? `<p class="idcard-role">${esc(g("role"))}</p>` : ""}
${g("tagline") ? `<p class="idcard-tagline">${esc(g("tagline"))}</p>` : ""}
${meta ? `<dl class="idcard-meta">${meta}</dl>` : ""}
<footer class="idcard-foot">
${web ? `<a href="${esc(safeHref(web))}" target="_blank" rel="noopener">${esc(web)}</a>` : ""}
${g("email") ? `<span>${esc(g("email"))}</span>` : ""}
${g("phone") ? `<span>${esc(g("phone"))}</span>` : ""}
</footer>
</article>`;
    })
    .join("");

  return `<section class="idcards">${cards}</section>`;
}

const PRINT_CSS = `@page{size:A4;margin:10mm}@media print{*{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{background:#fff;padding:0}.idcard{break-inside:avoid}}`;

export function buildCardsDocument(csv: string, css: string, _interactive = true): string {
  const body = renderCards(parseCsv(csv));
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&display=swap">
<style>${css.replace(/<\/style/gi, "<\\/style")}</style><style>${PRINT_CSS}</style></head><body>${body}</body></html>`;
}

/** Default CSS shown in the editor pane (the theme stylesheet). */
export const CARDS_DEFAULT_CSS = BASE_CSS;