import { describe, expect, it } from "vitest";
import { loadResumeThemes } from "./themes/load";

describe("Pop resume theme", () => {
  it("is registered and loads its stylesheet", () => {
    const theme = loadResumeThemes().find((item) => item.id === "resume-pop");

    expect(theme?.name).toBe("Pop");
    expect(theme?.css).toContain(".resume--uiux");
  });
});
