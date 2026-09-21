import Link from "next/link";
import { notFound } from "next/navigation";
import { BoardTable } from "@/components/board-table";
import { DataStatus } from "@/components/data-status";
import { SiteHeader } from "@/components/site-header";
import { loadPublicData } from "@/lib/public-data";
import type { BoardSlug } from "@/lib/types";
export default async function BoardPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const data = await loadPublicData(); const board = data.snapshot.boards[slug as BoardSlug]; if (!board) notFound(); return <main className="shell subpage"><SiteHeader date={data.snapshot.date} /><DataStatus data={data} /><p className="eyebrow page-kicker">{board.kind === "spec" ? "비용 기준 정렬" : "설명 가능한 순위"} · {data.snapshot.methodVersion.toUpperCase()}</p><h1>{board.label}<br /><em>하나의 질문에 답합니다.</em></h1><BoardTable board={board} /><aside className="method-callout"><p className="eyebrow">TRACEABILITY</p><h2>모든 숫자는 근거까지 열립니다.</h2><p>모델을 선택하면 원점수, 정규화 결과, 출처 URL과 관측일을 확인할 수 있습니다.</p><Link href="/methodology">계산 방식 보기 →</Link></aside></main>; }
