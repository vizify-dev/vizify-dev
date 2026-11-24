import type { View } from "@/components/ViewSwitch";

export type CloudProject = {
  id: string; name: string; view: View; csv?: string; css?: string; themeId: string | null;
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

export function saveProject(
  id: string | undefined, view: View, csv: string, css: string, themeId: string | null,
) {
  return id
    ? api<CloudProject>(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify({ csv, css, themeId }) })
    : api<CloudProject>("/api/projects", { method: "POST", body: JSON.stringify({ view, csv, css, themeId }) });
}