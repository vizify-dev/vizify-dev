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
  const emitted = new Set<string>();
  const uniqueList = (items: string, commaSeparated = false) => {
    const delimiter = commaSeparated ? /[,;|\r\n]+/ : /[;|\r\n]+/;
    return items
      .split(delimiter)
      .map((item) => item.trim())
      .filter((item, index, all) => item && all.findIndex((candidate) =>
        candidate.trim().toLowerCase() === item.toLowerCase()) === index);
  };

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
    const list = (items: string, commaSeparated = false) =>
      uniqueList(items, commaSeparated).join("|");

    const fullName = value("full name");
    const professionalTitle = value("professional title");
    if (fullName && !emitted.has("name")) {
      emitted.add("name");
      add("Name", fullName, professionalTitle);
    } else if (professionalTitle && !emitted.has("role")) {
      emitted.add("role");
      add("Name", "", professionalTitle);
    }

    for (const contact of [
      value("email"),
      value("phone"),
      value("location"),
      value("portfolio url", "portfolio"),
    ]) {
      const normalized = contact.toLowerCase();
      if (contact && !emitted.has(`contact:${normalized}`)) {
        emitted.add(`contact:${normalized}`);
        add("Contact", "", "", "", contact);
      }
    }

    const summary = value("summary");
    if (summary && !emitted.has(`summary:${summary.toLowerCase()}`)) {
      emitted.add(`summary:${summary.toLowerCase()}`);
      add("Summary", "", "", "", summary);
    }
    const skills = list(value("skills"), true);
    if (skills) add("Skills", "", "", "", skills);

    const educationName = value("education");
    const degreeName = value("education degree", "degree");
    const degree = [educationName, degreeName].filter(Boolean).join(" - ");
    const institution = value("institution", "school", "university");
    const graduationYear = value("graduation year", "graduation date");
    const educationKey = `education:${degree}|${institution}|${graduationYear}`.toLowerCase();
    if (!emitted.has(educationKey) && [degree, institution, graduationYear].some(Boolean)) {
      emitted.add(educationKey);
      add("Education", degree, institution, graduationYear);
    }

    const startDate = value("start date");
    const endDate = value("end date");
    const company = value("company", "employer");
    const jobTitle = value("job title", "position");
    const responsibilities = value("responsibilities", "description");
    const date = [startDate, endDate].filter(Boolean).join(" - ");
    const experienceKey =
      `experience:${jobTitle}|${company}|${date}|${responsibilities}`.toLowerCase();
    if (!emitted.has(experienceKey) &&
      [company, jobTitle, startDate, endDate, responsibilities].some(Boolean)) {
      emitted.add(experienceKey);
      add("Work Experience", jobTitle || company, jobTitle ? company : "", date, responsibilities);
    }

    const projects = list(value("projects"), true);
    if (projects) {
      for (const project of projects.split("|")) {
        const key = `project:${project.toLowerCase()}`;
        if (!emitted.has(key)) {
          emitted.add(key);
          add("Projects", project);
        }
      }
    }
    const certifications = list(value("certifications"), true);
    if (certifications) add("Certifications", "", "", "", certifications);
  }

  return rows;
}
