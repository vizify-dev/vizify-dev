export type ResumeRow = {
  section: string;
  title: string;
  subtitle: string;
  date: string;
  details: string;
};

const HEADER_KEYS = [
  "fullname",
  "email",
  "phone",
  "location",
  "professionaltitle",
  "summary",
  "skills",
  "educationdegree",
  "institution",
  "graduationyear",
  "company",
  "jobtitle",
  "startdate",
  "enddate",
  "responsibilities",
  "projects",
  "certifications",
  "portfoliourl",
] as const;

type HeaderKey = (typeof HEADER_KEYS)[number];

const normalizeHeader = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

function listItems(value: string, commaSeparated = false): string[] {
  const delimiter = commaSeparated ? /[,;|\r\n]+/ : /[;|\r\n]+/;
  return value.split(delimiter).map((item) => item.trim()).filter(Boolean);
}

export function readWideResumeRows(table: string[][]): ResumeRow[] | null {
  if (table.length === 0) return null;

  const indexes = new Map<string, number>();
  table[0].forEach((header, index) => {
    const key = normalizeHeader(header);
    if (HEADER_KEYS.includes(key as HeaderKey) && !indexes.has(key)) indexes.set(key, index);
  });
  if (!indexes.has("fullname") || indexes.size < 2) return null;

  const rows: ResumeRow[] = [];
  const emitted = new Set<string>();
  const value = (record: string[], key: HeaderKey) =>
    (record[indexes.get(key) ?? -1] ?? "").trim();
  const add = (
    section: string,
    title = "",
    subtitle = "",
    date = "",
    details = "",
  ) => {
    if (![title, subtitle, date, details].some(Boolean)) return;
    rows.push({ section, title, subtitle, date, details });
  };
  const addContact = (contact: string) => {
    const normalized = contact.toLowerCase();
    if (!contact || emitted.has(`contact:${normalized}`)) return;
    emitted.add(`contact:${normalized}`);
    add("Contact", "", "", "", contact);
  };

  for (const record of table.slice(1)) {
    const fullName = value(record, "fullname");
    const title = value(record, "professionaltitle");
    if (fullName && !emitted.has("name")) {
      emitted.add("name");
      add("Name", fullName, title);
    } else if (title && !emitted.has("role")) {
      emitted.add("role");
      add("Name", "", title);
    }

    addContact(value(record, "email"));
    addContact(value(record, "phone"));
    addContact(value(record, "location"));
    addContact(value(record, "portfoliourl"));

    const summary = value(record, "summary");
    if (summary && !emitted.has(`summary:${summary}`)) {
      emitted.add(`summary:${summary}`);
      add("Summary", "", "", "", summary);
    }

    const skills = value(record, "skills");
    if (skills) {
      const uniqueSkills = listItems(skills, true).filter((skill) => {
        const key = `skill:${skill.toLowerCase()}`;
        if (emitted.has(key)) return false;
        emitted.add(key);
        return true;
      });
      if (uniqueSkills.length) add("Skills", "", "", "", uniqueSkills.join("|"));
    }

    const degree = value(record, "educationdegree");
    const institution = value(record, "institution");
    const graduationYear = value(record, "graduationyear");
    if (degree || institution || graduationYear) {
      const key = `education:${degree}|${institution}|${graduationYear}`.toLowerCase();
      if (!emitted.has(key)) {
        emitted.add(key);
        add("Education", degree, institution, graduationYear);
      }
    }

    const company = value(record, "company");
    const jobTitle = value(record, "jobtitle");
    const startDate = value(record, "startdate");
    const endDate = value(record, "enddate");
    const responsibilities = value(record, "responsibilities");
    if (company || jobTitle || startDate || endDate || responsibilities) {
      const date = [startDate, endDate].filter(Boolean).join(" - ");
      const key = `experience:${jobTitle}|${company}|${date}|${responsibilities}`.toLowerCase();
      if (!emitted.has(key)) {
        emitted.add(key);
        add("Professional Experience", jobTitle || company, jobTitle ? company : "", date, responsibilities);
      }
    }

    const project = value(record, "projects");
    if (project && !emitted.has(`project:${project.toLowerCase()}`)) {
      emitted.add(`project:${project.toLowerCase()}`);
      add("Projects", project);
    }

    const certifications = value(record, "certifications");
    if (certifications) {
      const items = listItems(certifications, true).filter((item) => {
        const key = `certification:${item.toLowerCase()}`;
        if (emitted.has(key)) return false;
        emitted.add(key);
        return true;
      });
      if (items.length) add("Certifications", "", "", "", items.join("|"));
    }
  }

  return rows;
}
