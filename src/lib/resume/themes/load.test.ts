import { describe, expect, it } from "vitest";
import { loadResumeThemes } from "./load";

describe("resume theme registry", () => {
  it("loads only the requested resume themes in dropdown order", () => {
    expect(loadResumeThemes().map(({ id, name, hint }) => [id, name, hint])).toEqual([
      ["resume-classic", "Plain", "ATS-friendly"],
      ["resume-timeline", "Ledger", undefined],
      ["resume-editorial", "Margin", undefined],
      ["resume-executive", "Boardroom", "ATS-friendly"],
      ["resume-uiux", "Pop", undefined],
    ]);
  });
});
