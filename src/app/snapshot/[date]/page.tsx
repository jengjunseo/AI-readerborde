import { notFound } from "next/navigation";
import { BoardTable } from "@/components/board-table";
import { SiteHeader } from "@/components/site-header";
import { loadHistoricalSnapshot } from "@/lib/history";

export default async function SnapshotPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const snapshot = await loadHistoricalSnapshot(date);
  if (!snapshot) notFound();
  return <main className="shell subpage"><SiteHeader date={snapshot.date} /><p className="eyebrow page-kicker">과거 스냅샷 · {snapshot.methodVersion.toUpperCase()}</p><h1>{snapshot.date}<br /><em>당시 공개된 그대로.</em></h1><p className="intro-copy">입력 해시 <code>{snapshot.inputHash}</code> · 당시 계산법과 순위를 현재 규칙으로 덮어쓰지 않습니다.</p><div className="board-stack">{Object.values(snapshot.boards).filter((board) => board.entries.length).map((board) => <BoardTable board={board} key={board.slug} />)}</div></main>;
}
