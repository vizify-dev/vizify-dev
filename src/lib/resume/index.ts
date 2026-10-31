import { parseCsv } from "@/lib/csv-parser";
import RESUME_TEMPLATES_HTML from "./templates.html";

const COLS = ["section", "title", "subtitle", "date", "details"] as const;
type Col = (typeof COLS)[number];
type Row = Record<Col, string>;
type ResumeLayout = "graphic" | "sidebar" | "uiux";

const ESC: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const esc = (value: string) => value.replace(/[&<>"']/g, (character) => ESC[character]);
const split = (value: string) => value.split("|").map((item) => item.trim()).filter(Boolean);
const safeSrc = (url: string) => (/^(https:\/\/|data:image\/)/i.test(url) ? url : "");

const KINDS: [string, RegExp][] = [
  ["about", /about|summary|profile|objective/],
  ["experience", /experience|employment|work/],
  ["education", /education|academic/],
  ["skills", /skill/],
  ["languages", /language/],
  ["references", /reference/],
];

const TEMPLATES = new Map(
  Array.from(
    RESUME_TEMPLATES_HTML.matchAll(
      /<template data-template="([^"]+)">([\s\S]*?)<\/template>/g,
    ),
    ([, name, content]) => [name, content.trim()] as const,
  ),
);

function render(name: string, values: Record<string, string> = {}): string {
  const template = TEMPLATES.get(name);
  if (template === undefined) throw new Error(`Missing resume HTML template: ${name}`);

  return template.replace(/<!-- ([A-Z_]+) -->/g, (token, key: string) => {
    if (!(key in values)) throw new Error(`Missing ${key} value in resume template: ${name}`);
    return values[key];
  });
}

const kindOf = (name: string) =>
  KINDS.find(([, expression]) => expression.test(name.toLowerCase()))?.[0] ?? "other";

function icon(kind: "phone" | "mail" | "pin" | "web"): string {
  return render(`icon-${kind}`);
}

function contactKind(value: string): "phone" | "mail" | "pin" | "web" {
  if (value.includes("@")) return "mail";
  if (/^[+\d(][\d\s().+-]{5,}$/.test(value)) return "phone";
  if (/^(https?:\/\/|www\.)/i.test(value)) return "web";
  return "pin";
}

function rich(value: string): string {
  const match = /^([^:]{2,30}):\s+(.*)$/.exec(value);
  return match
    ? render("rich", { LABEL: esc(match[1]), VALUE: esc(match[2]) })
    : esc(value);
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
  const header = table[0].map((value) => value.trim().toLowerCase());
  const columnIndex = (column: Col) => header.indexOf(column);
  if (columnIndex("section") < 0) return { rows: [], missing: ["section"] };

  const rows = table.slice(1).map(
    (row) =>
      Object.fromEntries(
        COLS.map((column) => [
          column,
          columnIndex(column) < 0 ? "" : (row[columnIndex(column)] ?? "").trim(),
        ]),
      ) as Row,
  );
  return { rows, missing: [] };
}

function entry(row: Row, format: (value: string) => string): string {
  const items = split(row.details);
  return render("entry", {
    TITLE: row.title ? render("title", { VALUE: esc(row.title) }) : "",
    DATE: row.date ? render("date", { VALUE: esc(row.date) }) : "",
    SUBTITLE: row.subtitle ? render("subtitle", { VALUE: esc(row.subtitle) }) : "",
    BULLETS: items.length
      ? render("bullets", {
          ITEMS: items.map((item) => render("bullet", { VALUE: format(item) })).join(""),
        })
      : "",
  });
}

function renderSection(name: string, rows: Row[], layout?: ResumeLayout): string {
  const kind = kindOf(name);
  const items = rows.flatMap((row) => split(row.details));
  let body: string;

  if (rows.some((row) => row.title)) {
    body = rows.map((row) => entry(row, kind === "references" ? rich : esc)).join("");
  } else if (kind === "about") {
    body = rows.map((row) => render("paragraph", { VALUE: esc(row.details) })).join("");
  } else if (kind === "skills") {
    body = render("skills", {
      ITEMS: items
        .map((item) => {
          const match = /^(.*?)\s+(\d{1,3})%$/.exec(item);
          return layout === "graphic" && match
            ? render("graphic-skill", { NAME: esc(match[1]), SCORE: match[2] })
            : render("skill", { VALUE: esc(item) });
        })
        .join(""),
    });
  } else if (kind === "languages" && layout === "graphic") {
    body = render("languages", {
      ITEMS: items
        .map((item) => {
          const { name, score } = languageLevel(item);
          return render("language", {
            NAME: esc(name),
            SCORE: String(score ?? 0),
            LABEL: score === null ? "" : `${score}%`,
          });
        })
        .join(""),
    });
  } else if (rows.length === 1 && items.length === 1 && kind !== "languages") {
    body = render("paragraph", { VALUE: esc(rows[0].details) });
  } else {
    body = render("list", {
      ITEMS: items.map((item) => render("bullet", { VALUE: rich(item) })).join(""),
    });
  }

  return render("section", { KIND: kind, NAME: esc(name), BODY: body });
}

/** Converts resume CSV into HTML. All user-provided text and image sources are escaped. */
export function resumeToHtml(csv: string, photoOverride = "", layout?: ResumeLayout): string {
  const { rows, missing } = readRows(csv);
  if (missing.length) {
    return render("error", {
      MESSAGE: `Resume view needs columns: ${COLS.join(", ")}. Missing: ${missing.join(", ")}.`,
    });
  }
  if (rows.length === 0) return "";

  let name = "";
  let role = "";
  let photo = "";
  let contactName = "Contact";
  const contacts: string[] = [];
  const sections = new Map<string, Row[]>();

  for (const row of rows) {
    if (!row.section) continue;
    const key = row.section.toLowerCase();
    if (key === "name") {
      name = row.title || name;
      role = row.subtitle || role;
    } else if (key === "photo") {
      photo = safeSrc(row.details) || photo;
    } else if (key === "contact") {
      contactName = row.section;
      contacts.push(...split(row.details));
    } else {
      sections.set(row.section, [...(sections.get(row.section) ?? []), row]);
    }
  }

  const shownPhoto = safeSrc(photoOverride) || photo;
  const contactItems = contacts
    .map((contact) =>
      render("contact-item", {
        ICON: icon(contactKind(contact)),
        VALUE: esc(contact),
      }),
    )
    .join("");
  const displayName = layout === "graphic" && name.includes(" ")
    ? (() => {
        const parts = name.trim().match(/^(.+?)\s+(\S+)$/);
        return parts
          ? render("name-graphic", { FIRST: esc(parts[1]), LAST: esc(parts[2]) })
          : render("name", { VALUE: esc(name) });
      })()
    : render("name", { VALUE: esc(name) });
  const head = render("header", {
    PHOTO: shownPhoto ? render("photo", { SRC: esc(shownPhoto) }) : "",
    IDENTITY: render("identity", {
      NAME: name ? displayName : "",
      ROLE: role ? render("role", { VALUE: esc(role) }) : "",
    }),
    CONTACTS: contactItems ? render("contact-list", { ITEMS: contactItems }) : "",
    DECORATIONS: layout === "uiux" ? render("uiux-stickers") : "",
  });
  const contactSection = contactItems
    ? render("contact-section", { NAME: esc(contactName), ITEMS: contactItems })
    : "";
  const renderedSections = [...sections].map(([sectionName, sectionRows]) => ({
    kind: kindOf(sectionName),
    html: renderSection(sectionName, sectionRows, layout),
  }));

  if (layout === "uiux") {
    return render("article-uiux", {
      HEADER: head,
      CONTACT_SECTION: contactSection,
      BODY: renderedSections.map(({ html }) => html).join(""),
      SOCIALS: render("uiux-socials"),
    });
  }

  if (layout === "graphic") {
    return render("article-graphic", {
      HEADER: head,
      ABOUT: renderedSections
        .filter(({ kind }) => kind === "about")
        .map(({ html }) => html)
        .join(""),
      SIDEBAR: renderedSections
        .filter(({ kind }) => ["education", "skills", "languages"].includes(kind))
        .map(({ html }) => html)
        .join(""),
      CONTACT_SECTION: contactSection,
      MAIN: renderedSections
        .filter(({ kind }) => !["about", "education", "skills", "languages"].includes(kind))
        .map(({ html }) => html)
        .join(""),
    });
  }

  if (layout === "sidebar") {
    return render("article-sidebar", {
      HEADER: head,
      CONTACT_SECTION: contactSection,
      SIDEBAR: renderedSections
        .filter(({ kind }) => ["education", "skills", "languages"].includes(kind))
        .map(({ html }) => html)
        .join(""),
      MAIN: renderedSections
        .filter(({ kind }) => !["education", "skills", "languages"].includes(kind))
        .map(({ html }) => html)
        .join(""),
    });
  }

  return render("article-default", {
    HEADER: head,
    CONTACT_SECTION: contactSection,
    BODY: renderedSections.map(({ html }) => html).join(""),
  });
}

/** Creates the standalone resume document used by preview, download, and PDF export. */
export function buildResumeDocument(
  csv: string,
  css: string,
  photo = "",
  layout?: ResumeLayout,
): string {
  const safeCss = css.replace(/<\/style/gi, "<\\/style");
  return render("document", {
    RESUME_CSS: safeCss,
    LAYOUT: layout ?? "",
    RESUME: resumeToHtml(csv, photo, layout),
  });
}
