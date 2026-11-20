import { describe, expect, it } from "vitest";
import { loadResumeThemes } from "./load";

describe("resume theme registry", () => {
  it("loads the remaining resume themes", () => {
    expect(loadResumeThemes().map(({ id }) => id)).toEqual([
      "resume-classic",
      "resume-editorial",
      "resume-graphic",
    ]);
  });
});
