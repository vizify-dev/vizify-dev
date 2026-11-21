import { createClient } from "@/lib/supabase/server";
import { isPlan, type Plan } from "@/lib/plans";

export type CurrentUser = { id: string; plan: Exclude<Plan, "guest"> } | null;

export async function currentUser(): Promise<CurrentUser> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  if (!data || !isPlan(data.plan) || data.plan === "guest") return null;
  return { id: user.id, plan: data.plan };
}