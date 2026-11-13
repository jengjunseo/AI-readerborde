import { Suspense } from "react";
import { ScoreboardDashboard } from "@/components/scoreboard-dashboard";
import { SiteHeader } from "@/components/site-header";
import { DataStatus } from "@/components/data-status";
import { loadPublicData } from "@/lib/public-data";
import type { Snapshot } from "@/lib/types";
export default async function Home() {
  const data = await loadPublicData();
  // The list needs ranking values, not every benchmark breakdown. Detail pages
  // still load all leaves server-side; avoid sending them for every variant.
  const boards = Object.fromEntries(Object.entries(data.snapshot.boards).map(([key, board]) => [key, { ...board, entries: board.entries.map((entry) => ({ ...entry, components: {}, model: { ...entry.model, metrics: {} } })) }])) as Snapshot["boards"];
  const listData = { ...data, snapshot: { ...data.snapshot, boards } };
  return <main className="shell scoreboard-home"><SiteHeader date={data.snapshot.date} />
    {(data.health.stale || data.source === "fallback") && <DataStatus data={data} />}
    <Suspense fallback={<p>순위 불러오는 중…</p>}><ScoreboardDashboard data={listData} /></Suspense>
    <footer>매일 00:00 KST 수집 시작 · <a href={`/snapshot/${data.snapshot.date}`}>이날의 순위</a> · <a href="/methodology">출처와 계산 방법</a></footer>
  </main>;
}
