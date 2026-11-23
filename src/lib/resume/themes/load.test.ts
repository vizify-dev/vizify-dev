import { describe, expect, it } from "vitest";
import { loadResumeThemes } from "./load";

describe("resume theme registry", () => {
  it("loads only the requested resume themes in dropdown order", () => {
    expect(loadResumeThemes().map(({ id, name, hint }) => [id, name, hint])).toEqual([
      ["resume-pop", "Pop", undefined],
      ["resume-ledger", "Ledger", undefined],
      ["resume-margin", "Margin", undefined],
      ["resume-boardroom", "Boardroom", "ATS-friendly"],
      ["resume-plain", "Plain", "ATS-friendly"],
    ]);
  });
});
