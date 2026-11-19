import { describe, expect, it } from "vitest";
import { parseCsv } from "../csv-parser";
import { readWideResumeRows } from "./wide-format";

describe("wide-format resume CSV", () => {
  it("maps the uploaded resume fields into renderer sections", () => {
    const csv = `Full Name,Email,Phone,Location,Professional Title,Summary,Skills,Education,Degree,Institution,Graduation Year,Company,Job Title,Start Date,End Date,Responsibilities,Projects,Certifications,Portfolio URL
Ananya Das,ananya@example.com,+91-9000012345,"Kolkata, India",UX / Product Designer,"Designer focused on user research and inclusive design.","Figma; FigJam; UX Research",Bachelor of Design,Communication Design,National Institute of Design,2022,R&D Studio,Product Designer,2022-06,Present,"Designed a ""quick-start"" flow; reduced onboarding time.",Portfolio Website,Accessibility Certificate,ananya.example.com`;

    const rows = readWideResumeRows(parseCsv(csv));

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
  });

  it("does not interpret unrelated tabular data as a resume", () => {
    expect(readWideResumeRows(parseCsv("Name,Email\nAnanya,ananya@example.com"))).toBeNull();
  });
});
