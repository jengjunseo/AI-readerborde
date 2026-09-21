import Link from "next/link";
import type { Board } from "@/lib/types";

export function BoardTable({ board, compact = false }: { board: Board; compact?: boolean }) {
  const entries = compact ? board.entries.slice(0, 5) : board.entries;
  return <section className="board" aria-labelledby={`${board.slug}-title`}>
    <div className="board-title"><div><p className="eyebrow">{board.kind === "spec" ? "비용 지표" : "설명 가능한 순위"}</p><h2 id={`${board.slug}-title`}>{board.label}</h2><p>{board.description}</p></div><Link href={`/boards/${board.slug}`} className="text-link">전체 보기 <span>→</span></Link></div>
    <div className="rank-table" role="table" aria-label={`${board.label} rankings`}>
      <div className="rank-row rank-head" role="row"><span>순위</span><span>모델</span><span>{board.kind === "spec" ? "가격" : "점수"}</span><span>변동</span></div>
      {entries.map((entry) => { const delta = entry.previousRank ? entry.previousRank - entry.rank : undefined; return <Link href={`/models/${entry.model.slug}`} className="rank-row" role="row" key={entry.model.slug}>
        <strong>#{entry.rank}</strong><span><b>{entry.model.name}</b><small>{entry.model.provider}</small></span><b>{board.kind === "spec" ? `$${entry.value.toFixed(2)}` : entry.value.toFixed(1)}</b><em className={delta && delta > 0 ? "up" : delta && delta < 0 ? "down" : "flat"}>{delta === undefined ? "—" : delta > 0 ? `↑${delta}` : delta < 0 ? `↓${Math.abs(delta)}` : "—"}</em>
      </Link>; })}
    </div>
  </section>;
}
