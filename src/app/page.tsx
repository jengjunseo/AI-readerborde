import { Suspense } from "react";
import { ScoreboardDashboard } from "@/components/scoreboard-dashboard";
import { SiteHeader } from "@/components/site-header";
import { DataStatus } from "@/components/data-status";
import { loadPublicData } from "@/lib/public-data";
export default async function Home() {
  const data = await loadPublicData();
  return <main className="shell scoreboard-home"><SiteHeader date={data.snapshot.date} />
    {(data.health.stale || data.source === "fallback") && <DataStatus data={data} />}
    <Suspense fallback={<p>순위 불러오는 중…</p>}><ScoreboardDashboard data={data} /></Suspense>
    <footer>매일 00:00 KST 수집 시작 · <a href={`/snapshot/${data.snapshot.date}`}>이날의 순위</a> · <a href="/methodology">출처와 계산 방법</a></footer>
  </main>;
}
