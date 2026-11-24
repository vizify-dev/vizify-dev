import { describe, expect, it } from "vitest";
import { parseCsv } from "../csv-parser";
import { RESUME_THEME_DEFS } from "./resume";
import { SAMPLE_PHOTO_SRC, SAMPLE_SIDEBAR, SAMPLE_UIUX } from "./resume-samples";
import { loadResumeThemes } from "./themes/load";
import { readWideResumeRows } from "./wide-format";

describe("resume themes", () => {
  it("loads styles for every resume theme", () => {
    expect(loadResumeThemes()).toHaveLength(RESUME_THEME_DEFS.length);
  });
});

describe("resume sample photos", () => {
  it("includes the bundled photo in the Midnight and Pop sample data", () => {
    for (const sample of [SAMPLE_SIDEBAR, SAMPLE_UIUX]) {
      expect(parseCsv(sample).find(([section]) => section === "Photo")).toEqual([
        "Photo",
        "",
        "",
        "",
        SAMPLE_PHOTO_SRC,
      ]);
    }
  });
});

describe("wide-format resume CSV", () => {
  it("maps the resume fields shown in uploaded CSVs", () => {
    const csv = `Full Name,Email,Phone,Location,Professional Title,Summary,Skills,Education,Degree,Institution,Graduation Year,Company,Job Title,Start Date,End Date,Responsibilities,Projects,Certifications,Portfolio URL
Ananya Das,ananya@example.com,+91-9000012345,"Kolkata, India",UX / Product Designer,"Designer focused on user research and inclusive design.","Figma; FigJam; UX Research",Bachelor of Design,Communication Design,National Institute of Design,2022,R&D Studio,Product Designer,2022-06,Present,"Designed a ""quick-start"" flow; reduced onboarding time.",Portfolio Website,Accessibility Certificate,ananya.example.com`;

    const rows = readWideResumeRows(parseCsv(csv));

    expect(rows).not.toBeNull();
    expect(rows).toContainEqual({
      section: "Name",
      title: "Ananya Das",
      subtitle: "UX / Product Designer",
      date: "",
      details: "",
    });
    expect(rows).toContainEqual({
      section: "Education",
      title: "Bachelor of Design - Communication Design",
      subtitle: "National Institute of Design",
      date: "2022",
      details: "",
    });
    expect(rows).toContainEqual({
      section: "Work Experience",
      title: "Product Designer",
      subtitle: "R&D Studio",
      date: "2022-06 - Present",
      details: 'Designed a "quick-start" flow; reduced onboarding time.',
    });
    expect(rows?.find((row) => row.section === "Skills")?.details).toBe("Figma|FigJam|UX Research");
    expect(rows).toContainEqual({
      section: "Certifications",
      title: "",
      subtitle: "",
      date: "",
      details: "Accessibility Certificate",
    });
  });

  it("does not treat unrelated CSV headers as a resume", () => {
    expect(readWideResumeRows(parseCsv("Name,Email\nAnanya,ananya@example.com"))).toBeNull();
  });
});
