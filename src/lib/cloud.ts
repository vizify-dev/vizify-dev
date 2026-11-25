import type { View } from "@/components/ViewSwitch";

export type CloudProject = {
  id: string; name: string; view: View; csv?: string; css?: string; themeId: string | null;
};

export type SyncResult = {
  status: "pushed" | "pulled" | "conflict" | "in-sync";
  csv?: string;
  etag?: string;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const listProjects = () => api<CloudProject[]>("/api/projects");
export const getProject = (id: string) => api<CloudProject>(`/api/projects/${id}`);

/** csv is only used when creating. Updates leave it out; CSV goes through syncProject. */
export function saveProject(
  id: string | undefined, view: View, csv: string | undefined, css: string, themeId: string | null,
) {
  return id
    ? api<CloudProject>(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify({ css, themeId }) })
    : api<CloudProject>("/api/projects", { method: "POST", body: JSON.stringify({ view, csv: csv ?? "", css, themeId }) });
}

/** Push local edits (csv set) or just check S3 for changes (csv undefined). */
export const syncProject = (id: string, csv: string | undefined, baseEtag: string | null) =>
  api<SyncResult>(`/api/projects/${id}/sync`, { method: "POST", body: JSON.stringify({ csv, baseEtag }) });
export const renameProject = (id: string, name: string) =>
  api<CloudProject>(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify({ name }) });
export const duplicateProject = (id: string) =>
  api<CloudProject>(`/api/projects/${id}/duplicate`, { method: "POST" });
export const deleteProject = (id: string) =>
  api<void>(`/api/projects/${id}`, { method: "DELETE" });