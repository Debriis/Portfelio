import type { Profile, Project } from "../../../shared/types";
const base = process.env.NEXT_PUBLIC_API_URL || "";
async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${base.replace(/\/$/, "")}/api${path}`, {
    signal: AbortSignal.any([
      ...(signal ? [signal] : []),
      AbortSignal.timeout(12000),
    ]),
  });
  if (!response.ok)
    throw new Error("The signal was interrupted. Please try again.");
  return response.json();
}
export const api = {
  profile: (signal?: AbortSignal) => get<Profile>("/profile", signal),
  projects: (signal?: AbortSignal) => get<Project[]>("/projects", signal),
  project: (id: string, signal?: AbortSignal) =>
    get<Project>(`/projects/${encodeURIComponent(id)}`, signal),
};
export function safeUrl(url?: string) {
  return url && /^https?:\/\//i.test(url) ? url : undefined;
}
