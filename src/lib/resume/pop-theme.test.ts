import { describe, expect, it } from "vitest";
import { loadResumeThemes } from "./themes/load";

describe("Pop resume theme", () => {
  it("is registered and loads its stylesheet", () => {
    const theme = loadResumeThemes().find((item) => item.id === "resume-pop");

    expect(theme?.name).toBe("Pop");
    expect(theme?.css).toContain(".resume--uiux");
  });
});

describe("Additional resume themes", () => {
  it("registers and loads Margin and Plain stylesheets", () => {
    const themes = loadResumeThemes();
    const margin = themes.find((item) => item.id === "resume-margin");
    const plain = themes.find((item) => item.id === "resume-plain");

    expect(margin?.name).toBe("Margin");
    expect(margin?.css).toContain(".r-head:has(.r-photo)");
    expect(plain?.name).toBe("Plain");
    expect(plain?.css).toContain(".resume .r-head");
  });
});
