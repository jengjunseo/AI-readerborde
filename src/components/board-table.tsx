import Link from "next/link";
import { displayName, metricHeading, metricText } from "@/lib/presentation";
import type { Board } from "@/lib/types";
export function BoardTable({ board, compact = false, methodVersion = "v2.1" }: { board: Board; compact?: boolean; methodVersion?: string }) {
  const entries = compact ? board.entries.slice(0, 5) : board.entries;
  return <section className="ranking-panel"><h2>{board.label}</h2><p>{board.description}</p>
    {entries.length ? <table className="ranking-table"><caption className="sr-only">{board.label} 순위</caption><thead><tr><th scope="col" className="rank-column">순위</th><th scope="col">모델</th><th scope="col" className="metric-column">{metricHeading(board.slug)}</th></tr></thead><tbody>{entries.map((entry) => {
      const href = `/models/${entry.model.slug}?board=${board.slug}`;
      return <tr key={entry.model.slug}><td className="rank-column">{entry.rank}</td><th scope="row"><Link className="ranking-model" href={href}><span><b>{displayName(entry.model.name)}</b><small>{entry.model.provider}</small></span></Link></th><td className="metric-column"><Link className="ranking-metric" href={href}>{metricText(entry, board.slug, methodVersion)}</Link></td></tr>;
    })}</tbody></table> : <p className="ranking-empty">평가 자료 없음</p>}
  </section>;
}
