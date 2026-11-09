import { NextResponse } from "next/server";
import { can } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { projectPatch } from "@/lib/projects";
import { currentUser } from "@/lib/session";
import { THEME_DEFS } from "@/lib/table/themes";

type Context = { params: Promise<{ id: string }> };

const isPremiumTheme = (themeId: string | null | undefined) =>
  THEME_DEFS.some((theme) => theme.id === themeId && theme.pro);

export async function GET(_: Request, { params }: Context) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      name: true,
      view: true,
      csv: true,
      css: true,
      themeId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return project
    ? NextResponse.json(project)
    : NextResponse.json({ error: "not_found" }, { status: 404 });
}

export async function PATCH(request: Request, { params }: Context) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const parsed = projectPatch.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (isPremiumTheme(parsed.data.themeId) && !can(user.plan, "premiumThemes")) {
    return NextResponse.json(
      { error: "plan", message: "Premium themes require a Pro plan" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const { count } = await prisma.project.updateMany({
    where: { id, userId: user.id },
    data: parsed.data,
  });
  return count
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "not_found" }, { status: 404 });
}

export async function DELETE(_: Request, { params }: Context) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const { count } = await prisma.project.deleteMany({ where: { id, userId: user.id } });
  return count
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "not_found" }, { status: 404 });
}
