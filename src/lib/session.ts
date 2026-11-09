import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlan, type Plan } from "@/lib/plans";

export async function currentUser(): Promise<{ id: string; plan: Plan } | null> {
  const sessionUserId = (await auth.api.getSession({ headers: await headers() }))?.user?.id;
  if (!sessionUserId) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { id: true, plan: true },
  });
  if (!user) return null;
  if (!isPlan(user.plan) || user.plan === "guest") {
    throw new Error(`Unsupported account plan: ${user.plan}`);
  }
  return { id: user.id, plan: user.plan };
}
