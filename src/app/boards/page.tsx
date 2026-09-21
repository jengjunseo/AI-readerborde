import Link from "next/link";
import { DataStatus } from "@/components/data-status";
import { SiteHeader } from "@/components/site-header";
import { loadPublicData } from "@/lib/public-data";
export default async function BoardsPage() { const data = await loadPublicData(); return <main className="shell subpage"><SiteHeader date={data.snapshot.date} /><DataStatus data={data} /><p className="eyebrow page-kicker">여러 관점의 순위</p><h1>질문을 먼저 고르면<br /><em>승자가 달라집니다.</em></h1><div className="board-index">{Object.values(data.snapshot.boards).map((board) => <Link href={`/boards/${board.slug}`} key={board.slug}><p>{board.kind === "spec" ? "비용 지표" : "점수 보드"}</p><h2>{board.label}</h2><span>{board.description}</span><b>순위 열기 →</b></Link>)}</div></main>; }
