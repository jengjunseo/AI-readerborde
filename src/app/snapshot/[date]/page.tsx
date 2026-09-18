import Link from "next/link";
import { notFound } from "next/navigation";
import { BoardTable } from "@/components/board-table";
import { allBoards, getSnapshot } from "@/lib/catalog";

export default async function SnapshotPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const snapshot = getSnapshot(date);
  if (!snapshot) notFound();
  return <main className="shell subpage"><header className="topbar"><Link href="/" className="brand">AI <span>LEADERBOARD</span></Link><nav><Link href="/boards">Boards</Link><Link href="/methodology">Methodology</Link></nav></header><p className="eyebrow">HISTORICAL SNAPSHOT · {snapshot.methodVersion.toUpperCase()}</p><h1>{snapshot.date}<br /><em>as it was published.</em></h1><p className="intro-copy">Input hash <code>{snapshot.inputHash}</code> · Rankings retain the scoring method and rank reference from this date.</p><div className="board-stack">{allBoards(snapshot).map((board) => <BoardTable board={board} key={board.slug} />)}</div></main>;
}
