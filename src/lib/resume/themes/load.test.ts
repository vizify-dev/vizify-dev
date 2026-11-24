import { describe, expect, it } from "vitest";
import { loadResumeThemes } from "./load";

describe("resume theme registry", () => {
  it("loads the remaining resume themes", () => {
    expect(loadResumeThemes().map(({ id }) => id)).toEqual([
      "resume-classic",
      "resume-ledger",
      "resume-editorial",
      "resume-margin",
      "resume-plain",
      "resume-boardroom",
      "resume-midnight",
      "resume-pop",
      "resume-graphic",
    ]);
  });
});
