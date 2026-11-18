import { Suspense } from "react";
import { connection } from "next/server";
import Playground from "@/components/Playground";
import { loadResumeThemes } from "@/lib/resume/themes/load";
import { loadThemes } from "@/lib/table/themes/load";

export default function Home() {
  return (
    <Suspense>
      <HomePlayground />
    </Suspense>
  );
}

async function HomePlayground() {
  if (process.env.NODE_ENV === "development") {
    await connection();
    return (
      <Playground
        themes={loadThemes()}
        resumeThemes={loadResumeThemes()}
      />
    );
  }

  return <CachedHomePlayground />;
}

async function CachedHomePlayground() {
  "use cache";
  const themes = loadThemes();
  const resumeThemes = loadResumeThemes();
  return <Playground themes={themes} resumeThemes={resumeThemes} />;
}
