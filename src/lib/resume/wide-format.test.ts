import { describe, expect, it } from "vitest";
import { parseCsv } from "../csv-parser";
import { readWideResumeRows } from "./wide-format";

describe("wide-format resume CSV", () => {
  it("converts profile, education, work, skills, projects, and contacts", () => {
    const csv = `Full Name,Email,Phone,Location,Professional Title,Summary,Skills,Education Degree,Institution,Graduation Year,Company,Job Title,Start Date,End Date,Responsibilities,Projects,Certifications,Portfolio URL
Kabir Khan,kabir.khan@example.com,+91-9988776655,"Hyderabad, Telangana, India",Full Stack Software Engineer,"Software developer with experience building scalable web applications.",Java; TypeScript; React,Bachelor of Technology,Example University,2022,Example Company,Software Engineer,2023,Present,"Built, tested, and documented web applications.",Resume Builder,AWS Certified Developer,https://example.com`;

    const rows = readWideResumeRows(parseCsv(csv));

    expect(rows).not.toBeNull();
    expect(rows).toContainEqual({
      section: "Name",
      title: "Kabir Khan",
      subtitle: "Full Stack Software Engineer",
      date: "",
      details: "",
    });
    expect(rows).toContainEqual({
      section: "Contact",
      title: "",
      subtitle: "",
      date: "",
      details: "Hyderabad, Telangana, India",
    });
    expect(rows).toContainEqual({
      section: "Summary",
      title: "",
      subtitle: "",
      date: "",
      details: "Software developer with experience building scalable web applications.",
    });
    expect(rows).toContainEqual({
      section: "Skills",
      title: "",
      subtitle: "",
      date: "",
      details: "Java|TypeScript|React",
    });
    expect(rows).toContainEqual({
      section: "Education",
      title: "Bachelor of Technology",
      subtitle: "Example University",
      date: "2022",
      details: "",
    });
    expect(rows).toContainEqual({
      section: "Work Experience",
      title: "Software Engineer",
      subtitle: "Example Company",
      date: "2023 - Present",
      details: "Built, tested, and documented web applications.",
    });
    expect(rows).toContainEqual({
      section: "Projects",
      title: "Resume Builder",
      subtitle: "",
      date: "",
      details: "",
    });
    expect(rows).toContainEqual({
      section: "Certifications",
      title: "",
      subtitle: "",
      date: "",
      details: "AWS Certified Developer",
    });
    expect(rows).toContainEqual({
      section: "Contact",
      title: "",
      subtitle: "",
      date: "",
      details: "https://example.com",
    });
  });

  it("keeps the existing missing-section error for unsupported headers", () => {
    const rows = readWideResumeRows(parseCsv("Name,Role\nKabir Khan,Engineer"));

    expect(rows).toBeNull();
  });
});
