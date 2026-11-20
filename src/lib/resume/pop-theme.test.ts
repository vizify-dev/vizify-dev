import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadResumeThemes } from "./themes/load";
import { safePhotoSrc } from "./photo";

describe("Pop resume theme", () => {
  it("is registered and loads its stylesheet", () => {
    const theme = loadResumeThemes().find((item) => item.id === "resume-pop");

    expect(theme?.name).toBe("Pop");
    expect(theme?.css).toContain(".resume--uiux");
    expect(theme?.sample).toContain("Photo,,,,/images/resume-sample.jpeg");
    expect(theme?.css).toContain(".r-uiux-photo-label");
    expect(safePhotoSrc("/images/resume-sample.jpeg")).toBe("/images/resume-sample.jpeg");
    expect(safePhotoSrc("//example.com/photo.jpeg")).toBe("");
    expect(existsSync(path.join(process.cwd(), "public", "images", "resume-sample.jpeg"))).toBe(
      true,
    );
    const templates = readFileSync(
      path.join(process.cwd(), "src", "lib", "resume", "templates.html"),
      "utf8",
    );
    expect(templates).toContain('<span class="r-uiux-photo-label">UI/UX Designer</span>');
    expect(templates).toContain('<span class="r-uiux-paperclip"></span>');
    expect(templates).toContain("family=Roboto+Slab");
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
