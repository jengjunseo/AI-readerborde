import Link from "next/link";
import { notFound } from "next/navigation";
import { BoardTable } from "@/components/board-table";
import { DataStatus } from "@/components/data-status";
import { SiteHeader } from "@/components/site-header";
import { loadPublicData } from "@/lib/public-data";
import type { BoardSlug } from "@/lib/types";
export default async function BoardPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const data = await loadPublicData(); const board = data.snapshot.boards[slug as BoardSlug]; if (!board) notFound(); return <main className="shell subpage"><SiteHeader date={data.snapshot.date} /><DataStatus data={data} /><p className="eyebrow page-kicker">{board.kind === "spec" ? "비용 기준 정렬" : "모델 순위"} · {data.snapshot.methodVersion.toUpperCase()}</p><h1>{board.label}</h1><BoardTable board={board} /><aside className="method-callout"><h2>점수와 출처를 확인할 수 있습니다.</h2><p>모델을 선택하면 원점수, 환산 점수, 출처와 관측일이 표시됩니다.</p><Link href="/methodology">계산 방식 보기 →</Link></aside></main>; }
