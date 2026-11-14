import { describe, expect, it } from "vitest";
import { parseCsv } from "../csv-parser";
import { importCandidateResumes } from "./import-csv";

describe("importCandidateResumes", () => {
  it("converts one-row-per-person CSVs into selectable section-based resumes", () => {
    const csv = [
      "Full Name,Email,Phone,Location,Professional Title,Years Experience,Skills,Education,Previous Company,Previous Role,Start Date,End Date,Summary,Portfolio URL",
      'Aarav Sharma,aarav@example.com,+91-123,"Bhopal, India",Frontend Developer,3,React; TypeScript,"B.Tech Computer Science, 2023",BrightApps,Frontend Developer,2023-07,Present,"Built responsive dashboards.",https://example.com/aarav',
      'Meera Iyer,meera@example.com,+91-456,"Bengaluru, India",Data Analyst,5,SQL; Python,"M.Sc. Statistics, 2020",Northstar,Data Analyst,2021-02,Present,"Turns complex datasets into insights.",https://example.com/meera',
    ].join("\n");

    const candidates = importCandidateResumes(csv);

    expect(candidates?.map((candidate) => candidate.name)).toEqual(["Aarav Sharma", "Meera Iyer"]);
    const rows = parseCsv(candidates?.[0].csv ?? "");
    expect(rows.find((row) => row[0] === "Name")).toEqual([
      "Name",
      "Aarav Sharma",
      "Frontend Developer",
      "",
      "",
    ]);
    expect(rows.find((row) => row[0] === "Skills")?.[4]).toBe("React|TypeScript");
    expect(rows.find((row) => row[0] === "Work Experience")).toEqual([
      "Work Experience",
      "Frontend Developer",
      "BrightApps",
      "2023-07 - Present",
      "",
    ]);
    expect(rows.find((row) => row[0] === "About Me")?.[4]).toContain(
      "Built responsive dashboards.",
    );
  });

  it("converts a complete single-person CSV without requiring a selector", () => {
    const csv = [
      "Full Name,Email,Phone,Location,Professional Title,Summary,Skills,Education,Degree,Institution,Graduation Year,Company,Job Title,Start Date,End Date,Responsibilities,Projects,Certifications,Portfolio URL",
      'Priya Sharma,priya@example.com,+91-123,"Bhopal, Madhya Pradesh",Frontend Developer,"Builds responsive applications.",React; TypeScript,Bachelor of Technology,Computer Science,LNCT,2023,BrightApps,Frontend Developer,2023-07,Present,"Built reusable components; improved page performance.","Customer dashboard",Meta Certificate,https://example.com/priya',
    ].join("\n");

    const candidates = importCandidateResumes(csv);

    expect(candidates).toHaveLength(1);
    const rows = parseCsv(candidates?.[0].csv ?? "");
    expect(rows.find((row) => row[0] === "Education")).toEqual([
      "Education",
      "Bachelor of Technology, Computer Science",
      "LNCT",
      "2023",
      "",
    ]);
    expect(rows.find((row) => row[0] === "Work Experience")?.[4]).toBe(
      "Built reusable components|improved page performance.",
    );
    expect(rows.find((row) => row[0] === "Projects")?.[4]).toBe("Customer dashboard");
  });

  it("leaves section-based resume CSVs unchanged", () => {
    expect(
      importCandidateResumes("section,title,subtitle,date,details\nName,Ada,Engineer,,"),
    ).toBeNull();
  });
});
