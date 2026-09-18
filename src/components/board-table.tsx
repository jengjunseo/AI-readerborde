import Link from "next/link";
import type { Board } from "@/lib/types";

export function BoardTable({ board, compact = false }: { board: Board; compact?: boolean }) {
  const entries = compact ? board.entries.slice(0, 5) : board.entries;
  return <section className="board" aria-labelledby={`${board.slug}-title`}>
    <div className="board-title"><div><p className="eyebrow">{board.kind === "spec" ? "SPEC SORT" : "COMPOSITE BOARD"}</p><h2 id={`${board.slug}-title`}>{board.label}</h2><p>{board.description}</p></div><Link href={`/boards/${board.slug}`} className="text-link">Details <span>→</span></Link></div>
    <div className="rank-table" role="table" aria-label={`${board.label} rankings`}>
      <div className="rank-row rank-head" role="row"><span>Rank</span><span>Model</span><span>{board.kind === "spec" ? "Price" : "Score"}</span><span>Δ</span></div>
      {entries.map((entry) => { const delta = entry.previousRank ? entry.previousRank - entry.rank : undefined; return <Link href={`/models/${entry.model.slug}`} className="rank-row" role="row" key={entry.model.slug}>
        <strong>#{entry.rank}</strong><span><b>{entry.model.name}</b><small>{entry.model.provider}</small></span><b>{board.kind === "spec" ? `$${entry.value.toFixed(2)}` : entry.value.toFixed(1)}</b><em className={delta && delta > 0 ? "up" : delta && delta < 0 ? "down" : "flat"}>{delta === undefined ? "—" : delta > 0 ? `↑${delta}` : delta < 0 ? `↓${Math.abs(delta)}` : "—"}</em>
      </Link>; })}
    </div>
  </section>;
}
