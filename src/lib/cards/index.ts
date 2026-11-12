import { parseCsv } from "@/lib/csv-parser";
import { escapeHtml as esc } from "@/lib/html";
import type { ThemeOption } from "@/lib/resume/resume";
import BASE_CSS from "./styles/base.css";
import CLEAN_CSS from "./styles/themes/clean.css";
import DARK_CSS from "./styles/themes/dark.css";
import PATTERN_CSS from "./styles/themes/pattern.css";
import DUO_CSS from "./styles/themes/duo.css";
import CAMPUS_CSS from "./styles/themes/campus.css";
import CORPORATE_CSS from "./styles/themes/corporate.css";
import ECO_GREEN_CSS from "./styles/themes/eco-green.css";
import GRADIENT_POP_CSS from "./styles/themes/gradient-pop.css";
import MIDNIGHT_GOLD_CSS from "./styles/themes/midnight-gold.css";
import MINIMAL_MONO_CSS from "./styles/themes/minimal-mono.css";

const withBase = (css: string) => `${BASE_CSS}\n${css}`;

/** Columns the ID card themes read, in this order: Photo, Name, Role, Company, Tagline, Website, ID, Expires, Phone, Email. */
export const DEFAULT_ID_CARD_CSV = "Photo,Name,Role,Company,Tagline,Website,ID,Expires,Phone,Email\nhttps://i.pravatar.cc/500?img=12,Tarcisio Ribeiro,Engineer CEO,Alto Qi,Build smart solutions.,altoqi.com.br,DD06031995,18 Sep 2029,+91 98765 43210,tarcisio@example.com\nhttps://i.pravatar.cc/500?img=33,Joao Vitor,Systems Analyst,Alto Qi,Build smart solutions.,altoqi.com.br,DD06031996,18 Sep 2029,+91 98765 43211,joao@example.com\nhttps://i.pravatar.cc/500?img=47,Marija Cigoja,Sales Manager,DS Group,Quality you can trust.,dsgroup.example,DS-1042,01 Jan 2030,+91 98765 43212,marija@example.com\nhttps://i.pravatar.cc/500?img=15,Randi Pratama Putra,Leader,Fiqtuals,Design with intent.,fiqtuals.example,FQ-0007,30 Jun 2028,+62 812 3456 789,randi@example.com\nhttps://i.pravatar.cc/500?img=59,Ivan Maric,Installation Technician,DS Group,Quality you can trust.,dsgroup.example,DS-1043,01 Jan 2030,+91 98765 43213,ivan@example.com\n";

export const ID_CARD_THEMES: ThemeOption[] = [
  { id: "id-clean", name: "Clean (green)", css: withBase(CLEAN_CSS) },
  { id: "id-dark", name: "Dark", css: withBase(DARK_CSS) },
  { id: "id-pattern", name: "Pattern (orange)", css: withBase(PATTERN_CSS) },
  { id: "id-duo", name: "Duo (yellow/black)", css: withBase(DUO_CSS) },
  { id: "id-campus", name: "Campus", css: withBase(CAMPUS_CSS) },
  { id: "id-corporate", name: "Corporate", css: withBase(CORPORATE_CSS) },
  { id: "id-eco-green", name: "Eco Green", css: withBase(ECO_GREEN_CSS) },
  { id: "id-gradient-pop", name: "Gradient Pop", css: withBase(GRADIENT_POP_CSS) },
  { id: "id-midnight-gold", name: "Midnight Gold", css: withBase(MIDNIGHT_GOLD_CSS) },
  { id: "id-minimal-mono", name: "Minimal Mono", css: withBase(MINIMAL_MONO_CSS) },
];

const PRINT_RULES = `
@media print{
  body{padding:0}
  tbody,.sheet{gap:8mm}
  tr,.id-card{break-inside:avoid;-webkit-print-color-adjust:exact;print-color-adjust:exact}
}`;

const COLUMNS: string[][] = [
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
];

const safeImg = (u: string) => (/^(https?:\/\/|data:image\/)/i.test(u) ? u : "");
const initials = (name: string) =>
  name.split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();

/** Builds the ID card document using the matching markup for each theme style. */
export function buildIdCardDocument(csv: string, css: string): string {
  const [headers = [], ...rows] = parseCsv(csv);
  const names = headers.map((h) => h.trim().toLowerCase());
  const idx = COLUMNS.map((aliases) => names.findIndex((n) => aliases.includes(n)));
  const legacyLayout = css.includes("td:nth-child");

  let body: string;
  if (idx[1] < 0) {
    body = `<p style="max-width:520px;padding:16px 20px;border:1px solid #ffbdad;border-radius:8px;background:#ffebe6;color:#bf2600"><b>ID Cards view needs a Name column.</b><br><small>Found: ${esc(headers.join(", ") || "none")}</small></p>`;
  } else if (!legacyLayout) {
    const get = (row: string[], col: number) => (idx[col] < 0 ? "" : (row[idx[col]] ?? "").trim());
    const cards = rows
      .filter((row) => get(row, 1) !== "")
      .map((row) => {
        const name = get(row, 1);
        const photo = safeImg(get(row, 0));
        const meta = (
          [
            ["ID", get(row, 6)],
            ["Expires", get(row, 7)],
            ["Website", get(row, 5)],
            ["Email", get(row, 9)],
            ["Phone", get(row, 8)],
          ] as const
        )
          .filter(([, value]) => value)
          .map(([label, value]) => `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`)
          .join("");

        return `<article class="id-card">
<header class="id-top">${esc(get(row, 3))}</header>
<div class="id-photo">${photo ? `<img src="${esc(photo)}" alt="${esc(name)}">` : `<span class="id-initials">${esc(initials(name))}</span>`}</div>
<h2 class="id-name">${esc(name)}</h2>
<p class="id-role">${esc(get(row, 2))}</p>
<p class="id-tagline">${esc(get(row, 4))}</p>
${meta ? `<dl class="id-meta">${meta}</dl>` : ""}
</article>`;
      })
      .join("");
    body = `<main class="sheet">${cards}</main>`;
  } else {
    const get = (row: string[], col: number) => (idx[col] < 0 ? "" : (row[idx[col]] ?? "").trim());
    const cards = rows
      .filter((row) => get(row, 1) !== "")
      .map((row) => {
        const cells = COLUMNS.map((_, col) => {
          const v = get(row, col);
          if (col === 0) {
            const src = safeImg(v);
            return `<td>${src ? `<img src="${esc(src)}" alt="">` : ""}</td>`;
          }
          return `<td>${esc(v)}</td>`;
        }).join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");
    body = `<table><tbody>${cards}</tbody></table>`;
  }

  const styles = (css + PRINT_RULES).replace(/<\/style/gi, "<\\/style");
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap">
<style>body{margin:0;padding:40px;background:var(--page);color:var(--ink);font:14px/1.4 "DM Sans",system-ui,sans-serif}</style>
<style>${styles}</style></head><body>${body}</body></html>`;
}