import { Suspense } from "react";
import Playground from "@/components/Playground";
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
  return <Playground themes={themes} />;
}
