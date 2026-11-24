import { parseCsv } from "../csv-parser";

const RESUME_COLUMNS = ["section", "title", "subtitle", "date", "details"] as const;

export type ImportedResumeCandidate = {
  name: string;
  csv: string;
};

const normalizeHeader = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
const splitItems = (value: string) =>
  value.split(/[;|]/).map((item) => item.trim()).filter(Boolean);

function quoteCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function toResumeCsv(rows: string[][]): string {
  return [
    RESUME_COLUMNS.join(","),
    ...rows.map((row) => row.map(quoteCsv).join(",")),
  ].join("\n");
}

function convertCandidate(
  get: (...headers: string[]) => string,
  name: string,
  title: string,
): string {
  const rows: string[][] = [["Name", name, title, "", ""]];
  const addContact = (value: string) => {
    if (value) rows.push(["Contact", "", "", "", value]);
  };

  addContact(get("Email"));
  addContact(get("Phone"));
  addContact(get("Location"));
  addContact(get("Portfolio URL", "Portfolio", "Website"));

  const years = get("Years Experience");
  const summary = get("Summary");
  const yearsNote =
    years && !summary.toLowerCase().includes(`${years.toLowerCase()} year`)
      ? `${years} years of experience.`
      : "";
  const about = [summary, yearsNote].filter(Boolean).join(" ");
  if (about) rows.push(["About Me", "", "", "", about]);

  const education = [get("Education"), get("Degree")].filter(Boolean).join(", ");
  const institution = get("Institution");
  const graduationYear = get("Graduation Year");
  if (education || institution || graduationYear) {
    rows.push(["Education", education, institution, graduationYear, ""]);
  }

  const jobTitle = get("Job Title", "Previous Role") || title;
  const company = get("Company", "Previous Company");
  const startDate = get("Start Date");
  const endDate = get("End Date");
  const date = [startDate, endDate].filter(Boolean).join(" - ");
  const responsibilities = splitItems(get("Responsibilities", "Duties")).join("|");
  if (jobTitle || company || date || responsibilities) {
    rows.push(["Work Experience", jobTitle, company, date, responsibilities]);
  }

  const projects = splitItems(get("Projects")).join("|");
  if (projects) rows.push(["Projects", "", "", "", projects]);

  const certifications = splitItems(get("Certifications", "Certification"));
  for (const certification of certifications) {
    rows.push(["Certifications", certification, "", "", ""]);
  }

  const skills = splitItems(get("Skills")).join("|");
  if (skills) rows.push(["Skills", "", "", "", skills]);

  return toResumeCsv(rows);
}

/** Converts common one-row-per-person resume CSVs into the section-based resume format. */
export function importCandidateResumes(csv: string): ImportedResumeCandidate[] | null {
  const table = parseCsv(csv, "auto");
  const header = table[0]?.map(normalizeHeader);
  if (!header || header.includes("section") || !header.includes("full name")) return null;

  const indices = new Map(header.map((value, index) => [value, index]));
  const candidates = table.slice(1).flatMap((row) => {
    const get = (...headers: string[]) => {
      for (const name of headers) {
        const index = indices.get(normalizeHeader(name));
        if (index !== undefined) return (row[index] ?? "").trim();
      }
      return "";
    };

    const name = get("Full Name");
    if (!name) return [];

    const title = get("Professional Title", "Job Title", "Previous Role");
    return [{ name, csv: convertCandidate(get, name, title) }];
  });

  return candidates;
}
