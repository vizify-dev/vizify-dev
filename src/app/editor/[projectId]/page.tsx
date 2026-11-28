import { Suspense } from "react";
import { connection } from "next/server";
import Playground from "@/components/Playground";
import { loadResumeThemes } from "@/lib/resume/themes/load";
import { loadThemes } from "@/lib/table/themes/load";

async function ProjectEditorContent({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await connection();
  const { projectId } = await params;

  return (
    <Playground
      themes={loadThemes()}
      resumeThemes={loadResumeThemes()}
      projectId={projectId}
    />
  );
}

export default function ProjectEditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center text-ink3">Loading editor…</main>}>
      <ProjectEditorContent params={params} />
    </Suspense>
  );
}
