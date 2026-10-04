"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { boardOrder } from "@/lib/board-meta";
import { boardSlug, displayName, evaluationSetting, leaderboardUrl, metricHeading, metricText, toggleComparison } from "@/lib/presentation";
import type { PublicData } from "@/lib/public-data";
import { ProviderIcon } from "./provider-icon";

export function ScoreboardDashboard({ data }: { data: PublicData }) {
  const params = useSearchParams();
  const active = boardSlug(params.get("board"));
  const query = params.get("q") ?? "";
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const board = data.snapshot.boards[active];
  const entries = board.entries.filter(({ model }) => `${model.name} ${model.provider}`.toLowerCase().includes(query.toLowerCase().trim()));
  const returnUrl = leaderboardUrl(active, query);
  function select(slug: string) {
    const result = toggleComparison(selected, slug);
    setSelected(result.selected); setError(result.error ?? "");
  }
  return <>
    <nav className="ranking-tabs" aria-label="순위 분야">{boardOrder.map((slug) =>
      <Link key={slug} href={leaderboardUrl(slug, query)} scroll={false} aria-current={active === slug ? "page" : undefined}>{data.snapshot.boards[slug].label}{slug === "korean" && !data.snapshot.boards.korean.entries.length ? " (준비 중)" : ""}</Link>
    )}</nav>
    <section className="ranking-panel" aria-labelledby="ranking-title">
      <div className="ranking-heading"><h1 id="ranking-title">{board.label} 순위</h1><button type="button" aria-pressed={compareMode} onClick={() => { setCompareMode(!compareMode); setError(""); }}>{compareMode ? "비교 선택 닫기" : "두 모델 비교"}</button></div>
      <p className="ranking-description">{board.description} <Link href="/methodology">계산 방법</Link></p>
      <label className="search-field"><span>모델·개발사 검색</span><input type="search" value={query} placeholder="예: GPT, Claude, Google" onChange={(event) => window.history.replaceState(null, "", leaderboardUrl(active, event.target.value))} /></label>
      <p role="alert" className="selection-alert">{error}</p>
      {entries.length ? <table className="ranking-table"><caption className="sr-only">{board.label} 순위 · {data.snapshot.date}</caption>
        <thead><tr>{compareMode && <th scope="col" className="selection-column">선택</th>}<th scope="col" className="rank-column">순위</th><th scope="col">모델</th><th scope="col" className="metric-column">{metricHeading(active, data.snapshot.methodVersion)}</th></tr></thead>
        <tbody>{entries.map((entry) => {
          const href = `/models/${entry.model.slug}?board=${active}&return=${encodeURIComponent(returnUrl)}`;
          const setting = evaluationSetting(entry.model.name);
          return <tr key={entry.model.slug} className={entry.rank === 1 ? "ranking-first" : ""}>
            {compareMode && <td><button type="button" className="selection-control" aria-pressed={selected.includes(entry.model.slug)} aria-label={`${entry.model.name} 비교 ${selected.includes(entry.model.slug) ? "해제" : "선택"}`} onClick={() => select(entry.model.slug)}>{selected.includes(entry.model.slug) ? "✓" : "+"}</button></td>}
            <td className="rank-column">{entry.rank}</td>
            <th scope="row"><Link className="ranking-model" href={href}><ProviderIcon provider={entry.model.provider} /><span><b>{displayName(entry.model.name)}</b><small>{entry.model.provider}{setting ? ` · 평가 설정: ${setting}` : ""}</small></span></Link></th>
            <td className="metric-column"><Link className="ranking-metric" href={href} aria-label={`${entry.model.name} ${metricHeading(active, data.snapshot.methodVersion)} ${metricText(entry, active, data.snapshot.methodVersion)}, 상세 보기`}>{metricText(entry, active, data.snapshot.methodVersion)}</Link></td>
          </tr>;
        })}</tbody>
      </table> : <div className="ranking-empty">{board.entries.length ? "검색 결과가 없습니다." : "평가 자료가 없어 아직 순위를 제공하지 않습니다."}</div>}
    </section>
    {compareMode && <aside className="comparison-selection" aria-label="비교할 모델"><p aria-live="polite">{selected.length ? selected.map((slug) => displayName(data.snapshot.boards.overall.entries.find((entry) => entry.model.slug === slug)?.model.name ?? slug)).join(" · ") : "비교할 모델 두 개를 선택하세요."} ({selected.length}/2)</p>{selected.length === 2 && <Link href={`/compare?m=${selected.join(",")}&board=${active}`}>비교하기 →</Link>}{selected.length > 0 && <button onClick={() => { setSelected([]); setError(""); }}>선택 지우기</button>}</aside>}
  </>;
}
