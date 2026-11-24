import { describe, expect, it } from "vitest";
import { loadResumeThemes } from "./themes/load";

describe("Boardroom resume theme", () => {
  it("is registered with its executive layout styles", () => {
    const theme = loadResumeThemes().find((item) => item.id === "resume-boardroom");

    expect(theme?.name).toBe("Boardroom");
    expect(theme?.css).toContain(".resume--executive");
  });
});
