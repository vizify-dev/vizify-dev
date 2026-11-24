import { describe, expect, it } from "vitest";
import { loadResumeThemes } from "./themes/load";

describe("Margin and Plain resume themes", () => {
  it("registers and loads both stylesheets", () => {
    const themes = loadResumeThemes();
    const margin = themes.find((item) => item.id === "resume-margin");
    const plain = themes.find((item) => item.id === "resume-plain");

    expect(margin?.name).toBe("Margin");
    expect(margin?.css).toContain(".r-head:has(.r-photo)");
    expect(plain?.name).toBe("Plain");
    expect(plain?.css).toContain(".resume .r-head");
  });
});
