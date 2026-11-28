import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  isRetryableSaveFailure,
  ProjectConflictError,
  saveProject,
} from "./cloud";

const fetchMock = vi.fn<typeof fetch>();

describe("saveProject", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  describe("isRetryableSaveFailure", () => {
    it("allows retry for network errors and server errors only", () => {
      expect(isRetryableSaveFailure(new TypeError("Failed to fetch"))).toBe(true);
      expect(isRetryableSaveFailure(new ApiError("Server error", 500))).toBe(true);
      expect(isRetryableSaveFailure(new ApiError("Invalid input", 400))).toBe(false);
      expect(isRetryableSaveFailure(new ApiError("Rate limited", 429))).toBe(false);
      expect(isRetryableSaveFailure(new ProjectConflictError("Changed elsewhere"))).toBe(false);
      expect(isRetryableSaveFailure(new Error("Unexpected error"))).toBe(false);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends editor contents and the loaded version to the project save endpoint", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "project-1",
          name: "My resume",
          view: "resume",
          themeId: "resume-classic",
          updatedAt: "2026-11-28T08:00:00.000Z",
          etag: "etag-2",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    await saveProject(
      "project-1",
      "resume",
      "Name,Role\nAlex,Designer",
      ".resume { color: black; }",
      "resume-classic",
      "2026-11-28T07:00:00.000Z",
      "data:image/jpeg;base64,abc=",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/projects/project-1/save",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          view: "resume",
          csv: "Name,Role\nAlex,Designer",
          css: ".resume { color: black; }",
          themeId: "resume-classic",
          expectedUpdatedAt: "2026-11-28T07:00:00.000Z",
          photo: "data:image/jpeg;base64,abc=",
          overwrite: false,
        }),
      }),
    );
  });

  it("exposes the latest version when the server reports an edit conflict", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "This resume changed elsewhere.",
          updatedAt: "2026-11-28T08:00:00.000Z",
          etag: "etag-2",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      ),
    );

    await expect(
      saveProject("project-1", "resume", "csv", "css", null, "2026-11-28T07:00:00.000Z"),
    ).rejects.toEqual(
      expect.objectContaining({
        name: "ProjectConflictError",
        updatedAt: "2026-11-28T08:00:00.000Z",
        etag: "etag-2",
      }),
    );
  });
});
