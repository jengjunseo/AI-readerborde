import { DataStatus } from "@/components/data-status";
import { SiteHeader } from "@/components/site-header";
import { ScoreboardDashboard } from "@/components/scoreboard-dashboard";
import { loadPublicData } from "@/lib/public-data";
export default async function Home() { const data = await loadPublicData(); return <main className="shell">
  <SiteHeader date={data.snapshot.date} />
  <DataStatus data={data} />
  <ScoreboardDashboard data={data} />
  <footer>출처 기반 관측값 · 결정론적 순위 · 변경 불가능한 이력 · <a href="/methodology">방법론</a></footer>
</main>; }
