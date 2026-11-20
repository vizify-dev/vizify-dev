import { describe, expect, it } from "vitest";
import { loadResumeThemes } from "./load";

describe("resume theme registry", () => {
  it("loads only the requested resume themes in dropdown order", () => {
    expect(loadResumeThemes().map(({ id, name }) => [id, name])).toEqual([
      ["resume-uiux", "Pop"],
      ["resume-timeline", "Ledger"],
      ["resume-editorial", "Margin"],
      ["resume-executive", "Boardroom"],
      ["resume-classic", "Plain"],
    ]);
  });
});
