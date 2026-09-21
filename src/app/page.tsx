import Link from "next/link";
import { movementSummary } from "@/lib/catalog";
import { BoardTable } from "@/components/board-table";
import { DataStatus } from "@/components/data-status";
import { SiteHeader } from "@/components/site-header";
import { loadPublicData } from "@/lib/public-data";
const formatDate = (date: string) => new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Seoul" }).format(new Date(`${date}T00:00:00+09:00`));

export default async function Home() { const data = await loadPublicData(); const { snapshot } = data; const movement = movementSummary(snapshot); const leaders = ["overall", "coding", "price"] as const; return <main className="shell">
  <SiteHeader date={snapshot.date} />
  <DataStatus data={data} />
  <section className="intro" aria-labelledby="today-heading"><div><p className="eyebrow">매일 갱신되는 AI 산업 스코어보드</p><h1 id="today-heading">오늘의 AI 판도,<br /><em>근거까지 한눈에.</em></h1></div><p className="intro-copy">세 가지 관점, {snapshot.boards.overall.entries.length}개 모델. 점수부터 원자료·출처·관측일까지 추적할 수 있습니다.</p></section>
  <section className="pulse" aria-label="오늘의 순위 변화"><div><strong>{movement.up}</strong><span>순위 상승</span></div><div><strong>{movement.down}</strong><span>순위 하락</span></div><div><strong>{movement.newModels}</strong><span>신규 진입</span></div><p>{formatDate(snapshot.previousDate)} 공개 스냅샷과 비교한 변동입니다.</p></section>
  <section className="leaders" aria-label="오늘의 리더">{leaders.map((slug) => { const board = snapshot.boards[slug]; const entry = board.entries[0]; return <Link className="leader-card" href={`/boards/${slug}`} key={slug}><span>{board.label} 1위</span><strong>#{entry.rank}</strong><b>{entry.model.name}</b><small>{slug === "price" ? `$${entry.value.toFixed(2)} / 100만 토큰` : `${entry.value.toFixed(1)}점`}</small><i aria-hidden="true">↗</i></Link>; })}</section>
  <section className="section-head"><div><p className="eyebrow">핵심 리더보드</p><h2>순위와 이유를 함께 봅니다.</h2></div><Link href="/boards" className="text-link">전체 순위 <span>→</span></Link></section><div className="board-stack">{Object.values(snapshot.boards).map((board) => <BoardTable board={board} key={board.slug} compact />)}</div>
  <aside className="method-callout"><p className="eyebrow">METHOD V1</p><h2>AI가 임의로 만든 종합점수가 아닙니다.</h2><p>원점수 → 고정 기준 정규화 → 공개 계산식 → 날짜별 스냅샷 순서로 결정론적으로 계산합니다.</p><Link href="/methodology">방법론 보기 <span>→</span></Link></aside><footer>출처 기반 관측값 · 결정론적 순위 · 변경 불가능한 이력</footer>
</main>; }
