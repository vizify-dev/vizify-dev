import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Logo from "@/components/Logo";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

export const instant = false;

const findProject = cache((id: string) =>
  prisma.project.findUnique({
    where: { id },
    select: { id: true, name: true },
  }),
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await findProject(id);
  return {
    title: project ? `${project.name} | Vizify` : "Shared project | Vizify",
    description: project ? `A project shared with Vizify.` : "View a project shared with Vizify.",
    robots: { index: false, follow: false },
    openGraph: {
      title: project ? `${project.name} | Vizify` : "Shared project | Vizify",
      description: "View this project created with Vizify.",
      type: "website",
    },
  };
}

export default async function SharedProjectPage({ params }: Props) {
  const { id } = await params;
  const project = await findProject(id);
  if (!project) notFound();

  return (
    <main className="flex h-dvh flex-col bg-sunken">
      <header className="flex h-[56px] shrink-0 items-center gap-[12px] border-b border-line bg-surface px-[16px]">
        <Link href="/" aria-label="Vizify home" className="shrink-0">
          <Logo />
        </Link>
        <div className="h-[24px] w-px shrink-0 bg-line" />
        <h1 className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink">
          {project.name}
        </h1>
        <Link
          href="/"
          className="flex h-[36px] shrink-0 items-center rounded-[8px] bg-accent-light px-[12px] text-[13px] font-semibold text-ed hover:brightness-95"
        >
          Create your own
        </Link>
      </header>
      <iframe
        title={`${project.name} shared preview`}
        src={`/api/share/${encodeURIComponent(project.id)}`}
        sandbox=""
        referrerPolicy="no-referrer"
        className="min-h-0 w-full flex-1 border-0 bg-white"
      />
    </main>
  );
}
