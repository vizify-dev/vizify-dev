import { describe, expect, it } from "vitest";
import { loadResumeThemes } from "./themes/load";

describe("Ledger resume theme", () => {
  it("is registered and loads its stylesheet", () => {
    const theme = loadResumeThemes().find((item) => item.id === "resume-ledger");

    expect(theme?.name).toBe("Ledger");
    expect(theme?.css).toContain(".resume .r-head::after");
  });

  it("is the default resume theme", () => {
    expect(loadResumeThemes()[0]?.id).toBe("resume-ledger");
  });
});
