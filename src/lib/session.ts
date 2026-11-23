import { createClient } from "@/lib/supabase/server";
import { isPlan, type Plan } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

export type CurrentUser = { id: string; plan: Exclude<Plan, "guest"> } | null;

export async function currentUser(): Promise<CurrentUser> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) {
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .upsert({ id: user.id, plan: "free" }, { onConflict: "id" });
    if (error) return null;
    return { id: user.id, plan: "free" };
  }

  if (!isPlan(data.plan) || data.plan === "guest") return null;
  return { id: user.id, plan: data.plan };
}