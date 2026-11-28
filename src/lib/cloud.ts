import type { View } from "@/components/ViewSwitch";

export type CloudProject = {
  id: string;
  name: string;
  view: View;
  csv?: string;
  css?: string;
  photo?: string | null;
  themeId: string | null;
  updatedAt?: string;
  etag?: string | null;
};

export type SyncResult = {
  status: "pushed" | "pulled" | "conflict" | "in-sync";
  csv?: string;
  etag?: string;
  updatedAt?: string;
};

export class ProjectConflictError extends Error {
  constructor(
    message: string,
    readonly updatedAt?: string,
    readonly etag?: string | null,
  ) {
    super(message);
    this.name = "ProjectConflictError";
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isRetryableSaveFailure(error: unknown): boolean {
  if (error instanceof ProjectConflictError) return false;
  if (error instanceof ApiError) return error.status >= 500;
  return error instanceof TypeError;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    if (res.status === 409) {
      throw new ProjectConflictError(
        body?.error ?? "This resume changed elsewhere.",
        body?.updatedAt,
        body?.etag,
      );
    }
    throw new ApiError(body?.error ?? `Request failed (${res.status})`, res.status);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const listProjects = () => api<CloudProject[]>("/api/projects");
export const getProject = (id: string) => api<CloudProject>(`/api/projects/${id}`);

/** Creates a project or saves its editor files with an updated-at version check. */
export function saveProject(
  id: string | undefined,
  view: View,
  csv: string | undefined,
  css: string,
  themeId: string | null,
  expectedUpdatedAt?: string,
  photo?: string,
  overwrite = false,
) {
  return id
    ? api<CloudProject>(`/api/projects/${id}/save`, {
        method: "POST",
        body: JSON.stringify({ view, csv, css, themeId, expectedUpdatedAt, photo, overwrite }),
      })
    : api<CloudProject>("/api/projects", { method: "POST", body: JSON.stringify({ view, csv: csv ?? "", css, themeId }) });
}

/** Push local edits (csv set) or just check S3 for changes (csv undefined). */
export const syncProject = (id: string, csv: string | undefined, baseEtag: string | null) =>
  api<SyncResult>(`/api/projects/${id}/sync`, { method: "POST", body: JSON.stringify({ csv, baseEtag }) });
export const renameProject = (id: string, name: string, expectedUpdatedAt?: string) =>
  api<CloudProject>(`/api/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name, expectedUpdatedAt }),
  });
export const duplicateProject = (id: string) =>
  api<CloudProject>(`/api/projects/${id}/duplicate`, { method: "POST" });
export const deleteProject = (id: string) =>
  api<void>(`/api/projects/${id}`, { method: "DELETE" });