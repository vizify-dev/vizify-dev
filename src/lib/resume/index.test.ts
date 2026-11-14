import { describe, expect, it } from "vitest";
import { parseCsv } from "../csv-parser";
import { SAMPLE_PHOTO_SRC, SAMPLE_SIDEBAR, SAMPLE_UIUX } from "./resume-samples";

describe("resume sample photos", () => {
  it("includes the bundled photo in the Midnight and Pop sample data", () => {
    for (const sample of [SAMPLE_SIDEBAR, SAMPLE_UIUX]) {
      expect(parseCsv(sample).find(([section]) => section === "Photo")).toEqual([
        "Photo",
        "",
        "",
        "",
        SAMPLE_PHOTO_SRC,
      ]);
    }
  });
});
