export type ResumeRow = {
  section: string;
  title: string;
  subtitle: string;
  date: string;
  details: string;
};

/** Maps single-row resume CSVs into the section-based format used by the renderer. */
export function readWideResumeRows(table: string[][]): ResumeRow[] | null {
  if (table.length === 0) return null;

  const normalize = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalizedHeader = table[0].map(normalize);
  const fieldIndex = (...names: string[]) =>
    names.reduce(
      (found, name) => (found >= 0 ? found : normalizedHeader.indexOf(normalize(name))),
      -1,
    );
  if (fieldIndex("full name") < 0) return null;

  const rows: ResumeRow[] = [];
  for (const source of table.slice(1)) {
    const value = (...names: string[]) => {
      const index = fieldIndex(...names);
      return index < 0 ? "" : (source[index] ?? "").trim();
    };
    const add = (
      section: string,
      title = "",
      subtitle = "",
      date = "",
      details = "",
    ) => {
      if ([title, subtitle, date, details].some(Boolean)) {
        rows.push({ section, title, subtitle, date, details });
      }
    };
    const list = (items: string) =>
      items.split(/[;|]/).map((item) => item.trim()).filter(Boolean).join("|");

    add("Name", value("full name"), value("professional title"));
    for (const contact of [
      value("email"),
      value("phone"),
      value("location"),
      value("portfolio url", "portfolio"),
    ]) {
      add("Contact", "", "", "", contact);
    }
    add("Summary", "", "", "", value("summary"));
    add("Skills", "", "", "", list(value("skills")));

    const education = value("education");
    const degree = value("degree");
    add(
      "Education",
      [education, degree].filter(Boolean).join(" - "),
      value("institution", "school", "university"),
      value("graduation year", "graduation date"),
    );

    const startDate = value("start date");
    const endDate = value("end date");
    add(
      "Work Experience",
      value("job title", "position"),
      value("company", "employer"),
      [startDate, endDate].filter(Boolean).join(" - "),
      value("responsibilities", "description"),
    );
    add("Projects", "", "", "", list(value("projects")));
    add("Certifications", "", "", "", list(value("certifications")));
  }

  return rows;
}
