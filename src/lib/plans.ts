export type Plan = "guest" | "free" | "pro";

export const PLANS = {
  guest: { saveProject: false, maxProjects: 0, premiumThemes: false },
  free: { saveProject: true, maxProjects: 3, premiumThemes: false },
  pro: { saveProject: true, maxProjects: Infinity, premiumThemes: true },
} as const;

export type Feature = keyof (typeof PLANS)["guest"];

export const can = (plan: Plan, feature: Feature) => PLANS[plan][feature];

export function isPlan(value: unknown): value is Plan {
  return value === "guest" || value === "free" || value === "pro";
}
