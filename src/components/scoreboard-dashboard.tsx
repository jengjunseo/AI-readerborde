"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { boardOrder } from "@/lib/board-meta";
import { boardSlug, configurationLabel, leaderboardUrl, metricHeading, metricText, toggleComparison } from "@/lib/presentation";
import type { PublicData } from "@/lib/public-data";
import { ProviderIcon } from "./provider-icon";

export function ScoreboardDashboard({ data }: { data: PublicData }) {
  const params = useSearchParams();
  const active = boardSlug(params.get("board"));
  const query = params.get("q") ?? "";
  const all = params.get("all") === "1";
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const board = data.snapshot.boards[active];
  const entries = board.entries.filter(({ model }) => `${model.name} ${model.provider}`.toLowerCase().includes(query.toLowerCase().trim()));
  const visibleEntries = all ? entries : entries.slice(0, 13);
  const returnUrl = leaderboardUrl(active, query, all);
  function select(slug: string) {
    const result = toggleComparison(selected, slug);
    setSelected(result.selected); setError(result.error ?? "");
  }
  return <>
    <nav className="ranking-tabs" aria-label="순위 분야">{boardOrder.map((slug) =>
      <Link key={slug} href={leaderboardUrl(slug, query, all)} scroll={false} aria-current={active === slug ? "page" : undefined}>{data.snapshot.boards[slug].label}{slug === "korean" && !data.snapshot.boards.korean.entries.length ? " (준비 중)" : ""}</Link>
    )}</nav>
    <section className="ranking-panel" aria-labelledby="ranking-title">
      <div className="ranking-heading"><h1 id="ranking-title">{board.label} 조합 순위</h1><button type="button" aria-pressed={compareMode} onClick={() => { setCompareMode(!compareMode); setError(""); }}>{compareMode ? "비교 선택 닫기" : "두 조합 비교"}</button></div>
      <p className="ranking-description">{board.description} <Link href="/methodology">계산 방법</Link></p>
      <label className="search-field"><span>모델·추론 설정·개발사 검색</span><input type="search" value={query} placeholder="예: GPT, Claude, high" onChange={(event) => window.history.replaceState(null, "", leaderboardUrl(active, event.target.value, all))} /></label>
      <p className="detail-meta" aria-live="polite">같은 모델도 추론 설정이 다르면 별도 순위입니다. {entries.length > 0 && `${entries.length}개 평가 조합 중 ${all ? "전체" : "상위 " + visibleEntries.length + "개"} 표시`}</p>
      <p role="alert" className="selection-alert">{error}</p>
      {entries.length ? <table className="ranking-table"><caption className="sr-only">{board.label} 순위 · {data.snapshot.date}</caption>
        <thead><tr>{compareMode && <th scope="col" className="selection-column">선택</th>}<th scope="col" className="rank-column">순위</th><th scope="col">모델·설정</th><th scope="col" className="metric-column">{metricHeading(active, data.snapshot.methodVersion)}</th></tr></thead>
        <tbody>{visibleEntries.map((entry) => {
          const href = `/models/${entry.model.slug}?board=${active}&return=${encodeURIComponent(returnUrl)}`;
          return <tr key={entry.model.slug} className={entry.rank === 1 ? "ranking-first" : ""}>
            {compareMode && <td><button type="button" className="selection-control" aria-pressed={selected.includes(entry.model.slug)} aria-label={`${entry.model.name} 비교 ${selected.includes(entry.model.slug) ? "해제" : "선택"}`} onClick={() => select(entry.model.slug)}>{selected.includes(entry.model.slug) ? "✓" : "+"}</button></td>}
            <td className="rank-column">{entry.rank}</td>
            <th scope="row"><Link className="ranking-model" href={href}><ProviderIcon provider={entry.model.provider} /><span><b>{configurationLabel(entry.model.name)}</b><small>{entry.model.provider}</small></span></Link></th>
            <td className="metric-column"><Link className="ranking-metric" href={href} aria-label={`${entry.model.name} ${metricHeading(active, data.snapshot.methodVersion)} ${metricText(entry, active, data.snapshot.methodVersion)}, 상세 보기`}>{metricText(entry, active, data.snapshot.methodVersion)}</Link></td>
          </tr>;
        })}</tbody>
      </table> : <div className="ranking-empty">{board.entries.length ? "검색 결과가 없습니다." : "평가 자료가 없어 아직 순위를 제공하지 않습니다."}</div>}
      {entries.length > 13 && <Link className="detail-action" href={leaderboardUrl(active, query, !all)} scroll={false}>{all ? "상위 13개만 보기" : `전체 ${entries.length}개 조합 보기`}</Link>}
    </section>
    {compareMode && <aside className="comparison-selection" aria-label="비교할 조합"><p aria-live="polite">{selected.length ? selected.map((slug) => configurationLabel(Object.values(data.snapshot.boards).flatMap((b) => b.entries).find((entry) => entry.model.slug === slug)?.model.name ?? slug)).join(" · ") : "비교할 조합 두 개를 선택하세요."} ({selected.length}/2)</p>{selected.length === 2 && <Link href={`/compare?m=${selected.join(",")}&board=${active}`}>비교하기 →</Link>}{selected.length > 0 && <button onClick={() => { setSelected([]); setError(""); }}>선택 지우기</button>}</aside>}
  </>;
}
