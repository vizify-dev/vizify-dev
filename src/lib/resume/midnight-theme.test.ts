import { describe, expect, it } from "vitest";
import { loadResumeThemes } from "./themes/load";

describe("Midnight resume theme", () => {
  it("is registered and loads its stylesheet", () => {
    const theme = loadResumeThemes().find((item) => item.id === "resume-midnight");

    expect(theme?.name).toBe("Midnight");
    expect(theme?.css).toContain(".r-side");
  });
});
