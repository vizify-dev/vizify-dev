import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function GET() {
  const user = await getUser();
  if (!user) return new Response(null, { status: 401 });
  const rows = await prisma.project.findMany({ where: { userId: user.id } });
  return Response.json(rows);
}

export async function PUT(req: Request) {
  const user = await getUser();
  if (!user) return new Response(null, { status: 401 });
  const { view, csv, css } = await req.json();
  await prisma.project.upsert({
    where: { userId_view: { userId: user.id, view } },
    update: { csv, css },
    create: { userId: user.id, view, csv, css },
  });
  return Response.json({ ok: true });
}