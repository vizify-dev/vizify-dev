import { describe, expect, it } from "vitest";
import { groupPrintableColumns } from "./export";

describe("groupPrintableColumns", () => {
  it("includes every data column exactly once across wide-table pages", () => {
    const groups = groupPrintableColumns([140, 220, 220, 220, 220, 220, 220], 1460);

    expect(groups.length).toBeGreaterThan(1);
    expect(groups.flat()).toEqual([1, 2, 3, 4, 5, 6]);
    expect(groups.every((group) => group.length <= 5)).toBe(true);
  });

  it("uses a fallback when the browser cannot measure table columns", () => {
    const groups = groupPrintableColumns(Array(10).fill(0), 1400);

    expect(groups.length).toBeGreaterThan(1);
    expect(groups.flat()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("keeps a table that fits on one page together", () => {
    expect(groupPrintableColumns([120, 220, 220], 560)).toEqual([[1, 2]]);
  });
});
