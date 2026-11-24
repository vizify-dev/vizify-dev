import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SAMPLE_PHOTO_SRC } from "./resume-samples";
import { loadResumeThemes } from "./themes/load";

describe("Midnight resume theme", () => {
  it("is registered with its sidebar layout styles", () => {
    const theme = loadResumeThemes().find((item) => item.id === "resume-midnight");

    expect(theme?.name).toBe("Midnight");
    expect(theme?.css).toContain(".r-side");
  });

  it("ships a sample portrait in its default resume", () => {
    const theme = loadResumeThemes().find((item) => item.id === "resume-midnight");

    expect(theme?.sample).toContain(`Photo,,,,${SAMPLE_PHOTO_SRC}`);
    expect(existsSync(path.join(process.cwd(), "public", SAMPLE_PHOTO_SRC))).toBe(true);
  });
});
