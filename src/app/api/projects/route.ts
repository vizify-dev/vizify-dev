import { NextResponse } from "next/server";
import { can, PLANS } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { projectInput } from "@/lib/projects";
import { currentUser } from "@/lib/session";
import { THEME_DEFS } from "@/lib/table/themes";

const isPremiumTheme = (themeId: string | null | undefined) =>
  THEME_DEFS.some((theme) => theme.id === themeId && theme.pro);

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, view: true, themeId: true, updatedAt: true },
  });
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!can(user.plan, "saveProject")) {
    return NextResponse.json(
      { error: "plan", message: "Upgrade to save projects" },
      { status: 403 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = projectInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (isPremiumTheme(parsed.data.themeId) && !can(user.plan, "premiumThemes")) {
    return NextResponse.json(
      { error: "plan", message: "Premium themes require a Pro plan" },
      { status: 403 },
    );
  }

  const count = await prisma.project.count({ where: { userId: user.id } });
  const maxProjects = PLANS[user.plan].maxProjects;
  if (count >= maxProjects) {
    return NextResponse.json(
      { error: "limit", message: `Your plan allows ${maxProjects} projects` },
      { status: 403 },
    );
  }

  const project = await prisma.project.create({
    data: { ...parsed.data, userId: user.id },
    select: { id: true },
  });
  return NextResponse.json(project, { status: 201 });
}
