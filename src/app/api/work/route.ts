import { NextResponse } from "next/server";
import { can, PLANS } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { projectInput } from "@/lib/projects";
import { currentUser } from "@/lib/session";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rows = await prisma.project.findMany({ where: { userId: user.id } });
  return NextResponse.json(rows);
}

export async function PUT(request: Request) {
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

  const existing = await prisma.project.findFirst({
    where: { userId: user.id, view: parsed.data.view },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  if (existing) {
    await prisma.project.updateMany({
      where: { id: existing.id, userId: user.id },
      data: { csv: parsed.data.csv, css: parsed.data.css },
    });
    return NextResponse.json({ ok: true });
  }

  const count = await prisma.project.count({ where: { userId: user.id } });
  const maxProjects = PLANS[user.plan].maxProjects;
  if (count >= maxProjects) {
    return NextResponse.json(
      { error: "limit", message: `Your plan allows ${maxProjects} projects` },
      { status: 403 },
    );
  }

  await prisma.project.create({ data: { ...parsed.data, userId: user.id } });
  return NextResponse.json({ ok: true }, { status: 201 });
}