import { parseCsv } from "@/lib/csv-parser";
import { escapeHtml as esc } from "@/lib/html";
import { getCertificateTheme } from "./themes";

import DOCUMENT_HTML from "./templates/document.html";
import SHEET_HTML from "./templates/sheet.html";
import TOOLBAR_HTML from "./templates/toolbar.html";
import CERTIFICATE_HTML from "./templates/certificate.html";
import SIGN_BLOCK_HTML from "./templates/sign-block.html";
import META_ITEM_HTML from "./templates/meta-item.html";
import SEAL_RING_HTML from "./templates/seal-ring.html";
import SEAL_BADGE_HTML from "./templates/seal-badge.html";
import SEAL_MEDAL_HTML from "./templates/seal-medal.html";
import ERROR_HTML from "./templates/error.html";
import INTERACTIVE_CSS from "./styles/interactive.css";
import PRINT_CSS from "./styles/print.css";
import SCRIPT_HTML from "./runtime/certificates.script.html";
import RUNTIME from "./runtime/certificates.runtime.generated.txt";

const SCRIPT = SCRIPT_HTML.replace("/* CERTIFICATES_RUNTIME */", () => RUNTIME);

/** Header aliases (lowercase) for each field. */
const ALIASES = {
  name: ["name", "full name", "recipient", "student name", "participant"],
  course: ["course", "program", "programme", "event", "achievement", "workshop", "subject"],
  type: ["type", "certificate type", "award"],
  title: ["certificate title", "title"],
  date: ["date", "issued on", "issue date", "issuing date", "completion date"],
  org: ["issuer", "organization", "organisation", "company", "institute", "academy"],
  signer: ["signatory", "signed by", "instructor", "director", "authorized by"],
  signerRole: ["signatory title", "designation", "role", "signer title"],
  signer2: ["signatory 2", "signed by 2", "second signatory"],
  signer2Role: ["signatory 2 title", "designation 2", "second signatory title"],
  id: ["certificate id", "cert id", "id", "serial"],
  desc: ["description", "reason", "citation", "message"],
} as const;

/** The sentence that links the recipient to the course, chosen by Type. */
const PHRASES: Record<string, string> = {
  completion: "for successfully completing",
  achievement: "in recognition of outstanding achievement in",
  participation: "for active participation in",
  excellence: "for excellence in",
  appreciation: "in appreciation of valuable contributions to",
};

/** Short word shown on the badge seal. */
const BADGE_WORDS: Record<string, string> = {
  completion: "COMPLETED",
  participation: "ATTENDED",
  achievement: "AWARDED",
  excellence: "EXCELLENCE",
  appreciation: "THANK YOU",
};

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (html, [token, value]) => html.replaceAll(`<!-- ${token} -->`, () => value),
    template.trim(),
  );
}

function sealHtml(style: string, uid: number, type: string, org: string, date: string): string {
  const word = BADGE_WORDS[type.toLowerCase()] ?? (type ? type.toUpperCase() : "CERTIFIED");
  if (style === "ring") {
    const ring = `${word} \u2022 ${(org || "Certified").toUpperCase()} \u2022`;
    return fill(SEAL_RING_HTML, { UID: String(uid), RING_TEXT: esc(ring) });
  }
  if (style === "badge") {
    const year = date.match(/\b(19|20)\d{2}\b/)?.[0] ?? "";
    return fill(SEAL_BADGE_HTML, { TOP: esc(word), BOTTOM: esc(year) });
  }
  if (style === "medal") return fill(SEAL_MEDAL_HTML, { UID: String(uid) });
  return "";
}

export function renderCertificates(
  rows: string[][],
  themeId?: string,
  interactive = true,
): { body: string } {
  const theme = getCertificateTheme(themeId);
  const [header = [], ...data] = rows;
  const names = header.map((h) => h.trim().toLowerCase());
  const idx = Object.fromEntries(
    Object.entries(ALIASES).map(([field, aliases]) => [
      field,
      names.findIndex((n) => (aliases as readonly string[]).includes(n)),
    ]),
  ) as Record<keyof typeof ALIASES, number>;

  if (idx.name < 0) {
    return { body: fill(ERROR_HTML, { FOUND: esc(header.join(", ") || "none") }) };
  }

  const get = (r: string[], i: number) => (i < 0 ? "" : (r[i] ?? "").trim());
  const people = data.filter((r) => get(r, idx.name) !== "");

  const sign = (value: string, label: string) =>
    fill(SIGN_BLOCK_HTML, {
      EMPTY: value || label ? "" : " is-empty",
      VALUE: esc(value),
      LABEL: esc(label),
    });

  const certs = people
    .map((r, i) => {
      const type = get(r, idx.type);
      const course = get(r, idx.course);
      const desc = get(r, idx.desc);
      const date = get(r, idx.date);
      const certId = get(r, idx.id);
      const customTitle = get(r, idx.title);
      const phrase = PHRASES[type.toLowerCase()] ?? PHRASES.completion;
      const reason = desc
        ? esc(desc)
        : course
          ? `${esc(phrase)} <strong>${esc(course)}</strong>`
          : "";
      const meta = [
        certId && fill(META_ITEM_HTML, { K: "Certificate ID", V: esc(certId) }),
        date && fill(META_ITEM_HTML, { K: "Issuing Date", V: esc(date) }),
      ]
        .filter(Boolean)
        .join("");
      return fill(CERTIFICATE_HTML, {
        ORG: esc(get(r, idx.org)),
        TITLE_MAIN: esc(customTitle || "Certificate"),
        TITLE_SUB: customTitle ? "" : esc(`of ${type || "Completion"}`),
        NAME: esc(get(r, idx.name)),
        REASON: reason,
        SIGN_LEFT: sign(get(r, idx.signer), get(r, idx.signerRole)),
        SEAL: sealHtml(theme.seal, i, type, get(r, idx.org), date),
        SIGN_RIGHT: sign(get(r, idx.signer2), get(r, idx.signer2Role)),
        META: meta,
      });
    })
    .join("");

  return {
    body: fill(SHEET_HTML, {
      COUNT: String(people.length),
      TOOLBAR: interactive ? TOOLBAR_HTML.trim() : "",
      CERTS: certs,
    }),
  };
}

/** Standalone certificate pages (one A4 landscape page per row) styled by the editor CSS. */
export function buildCertificatesDocument(
  csv: string,
  css: string,
  themeId?: string,
  interactive = true,
): string {
  const { body } = renderCertificates(parseCsv(csv), themeId, interactive);
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
