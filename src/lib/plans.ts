export type Plan = "guest" | "free" | "pro";
export const isPlan = (v: unknown): v is Plan =>
  v === "guest" || v === "free" || v === "pro";

export const PROJECT_LIMIT: Record<Plan, number> = { guest: 0, free: 3, pro: Infinity };

// Fill with your premium theme IDs
export const PREMIUM_THEMES = new Set<string>([]);
export const canUseTheme = (plan: Plan, themeId?: string | null) =>
  !themeId || !PREMIUM_THEMES.has(themeId) || plan === "pro";