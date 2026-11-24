import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SAMPLE_PHOTO_SRC } from "./resume-samples";
import { loadResumeThemes } from "./themes/load";

describe("Pop resume theme", () => {
  it("is registered with its UI/UX layout styles", () => {
    const theme = loadResumeThemes().find((item) => item.id === "resume-pop");

    expect(theme?.name).toBe("Pop");
    expect(theme?.css).toContain(".resume--uiux");
    expect(theme?.css).toContain(".r-uiux-photo-label");
  });

  it("ships a sample portrait in its default resume", () => {
    const theme = loadResumeThemes().find((item) => item.id === "resume-pop");

    expect(theme?.sample).toContain(`Photo,,,,${SAMPLE_PHOTO_SRC}`);
    expect(existsSync(path.join(process.cwd(), "public", SAMPLE_PHOTO_SRC))).toBe(true);
  });
});
