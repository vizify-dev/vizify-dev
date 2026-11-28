import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next-path";

describe("safeNextPath", () => {
  it("uses the dashboard when the destination is missing", () => {
    expect(safeNextPath(null)).toBe("/dashboard");
  });

  it("accepts internal paths with query strings and fragments", () => {
    expect(safeNextPath("/?p=project-1#editor")).toBe("/?p=project-1#editor");
  });

  it("rejects external and protocol-relative destinations", () => {
    expect(safeNextPath("https://example.com")).toBe("/dashboard");
    expect(safeNextPath("//example.com")).toBe("/dashboard");
  });

  it("rejects backslash-based external URLs", () => {
    expect(safeNextPath("/\\example.com")).toBe("/dashboard");
  });
});
