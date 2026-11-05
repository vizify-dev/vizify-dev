import { Suspense } from "react";
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
  "use cache";
  const themes = loadThemes();
  const resumeThemes = loadResumeThemes();
  return <Playground themes={themes} resumeThemes={resumeThemes} />;
}
