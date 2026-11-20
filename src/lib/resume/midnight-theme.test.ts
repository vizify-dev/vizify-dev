import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { safePhotoSrc } from "./photo";
import { loadResumeThemes } from "./themes/load";

describe("Midnight resume theme", () => {
  it("is the default theme and loads its stylesheet", () => {
    const theme = loadResumeThemes().find((item) => item.id === "resume-midnight");

    expect(theme?.name).toBe("Midnight");
    expect(theme?.css).toContain(".r-side");
    expect(loadResumeThemes()[0]?.id).toBe("resume-midnight");
  });

  it("includes a sample portrait in its default resume", () => {
    const theme = loadResumeThemes().find((item) => item.id === "resume-midnight");

    expect(theme?.sample).toContain(
      "Photo,,,,/images/resume-sample.jpeg",
    );
    expect(existsSync(path.join(process.cwd(), "public", "images", "resume-sample.jpeg"))).toBe(
      true,
    );
    expect(safePhotoSrc("/images/resume-sample.jpeg")).toBe("/images/resume-sample.jpeg");
    expect(safePhotoSrc("//example.com/photo.jpeg")).toBe("");
    expect(safePhotoSrc("https://example.com/photo.jpeg")).toBe(
      "https://example.com/photo.jpeg",
    );
    expect(safePhotoSrc("data:image/png;base64,abc")).toBe("data:image/png;base64,abc");
  });
});
