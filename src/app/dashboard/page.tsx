import { Suspense } from "react";
import { connection } from "next/server";
import Dashboard from "@/components/Dashboard";
import { DEFAULT_RESUME_CSV } from "@/lib/resume/resume";
import { loadResumeThemes } from "@/lib/resume/themes/load";

export default function DashboardPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center text-ink3">Loading dashboard…</main>}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  await connection();
  const resumeTheme = loadResumeThemes().find((theme) => theme.id === "resume-classic");

  return (
    <Dashboard
      defaultResumeCsv={DEFAULT_RESUME_CSV}
      defaultResumeCss={resumeTheme?.css ?? ""}
      defaultResumeThemeId={resumeTheme?.id ?? null}
    />
  );
}
