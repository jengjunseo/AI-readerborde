"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, ChevronDown, ExternalLink, GitCompareArrows, Minus, X } from "lucide-react";
import { boardMeta, boardOrder } from "@/lib/board-meta";
import type { PublicData } from "@/lib/public-data";
import type { BoardSlug, RankedEntry } from "@/lib/types";
import { ProviderIcon } from "./provider-icon";
const ScoreScatterChart = dynamic(() => import("./score-scatter-chart"), { ssr: false, loading: () => <div className="chart-skeleton" aria-label="차트 로딩 중" /> });
const LatestModelChart = dynamic(() => import("./latest-model-chart"), { ssr: false, loading: () => <div className="latest-model-panel chart-skeleton" aria-label="최신 모델 차트 로딩 중" /> });

const compactName = (name: string) => name.replace(/\s*\(Adaptive Reasoning,?\s*/i, " (").replace(/,? Default Fallback/i, "");
const deltaFor = (entry: RankedEntry) => entry.previousRank === undefined ? undefined : entry.previousRank - entry.rank;
const scoreFormat = (value: number) => value.toFixed(1);

function Delta({ entry }: { entry: RankedEntry }) {
  const delta = deltaFor(entry);
  if (entry.isNew) return <span className="new-badge">NEW</span>;
  if (!delta) return <span className="delta flat"><Minus size={13} aria-hidden="true" /><span className="sr-only">변동 없음</span></span>;
  return <span className={`delta ${delta > 0 ? "up" : "down"}`}>{delta > 0 ? <ArrowUp size={13} aria-hidden="true" /> : <ArrowDown size={13} aria-hidden="true" />}{Math.abs(delta)}</span>;
}

function Evidence({ entry }: { entry: RankedEntry }) {
  const leaves = Object.entries(entry.components);
  return <div className="evidence-grid">{leaves.map(([label, component]) => <article key={label} className="evidence-leaf"><div><span>{label}</span><b>{component.raw.toFixed(1)} → {component.normalized.toFixed(1)}</b></div><div className="evidence-bar"><i style={{ width: `${component.normalized}%` }} /></div><a href={component.source.url} target="_blank" rel="noreferrer">{component.source.label}<ExternalLink size={12} aria-hidden="true" /><small>{component.source.observedAt}</small></a></article>)}</div>;
}

function RankTable({ entries, selected, onSelect }: { entries: RankedEntry[]; selected: string[]; onSelect: (slug: string) => void }) {
  const [expanded, setExpanded] = useState<string>();
  if (!entries.length) return <div className="empty-state"><b>평가 대기</b><p>검증 가능한 한국어 평가가 두 축 이상 확보되기 전에는 순위를 만들지 않습니다. 결측값을 0점으로 채우지 않습니다.</p></div>;
  return <div className="score-table" role="table" aria-label="AI 모델 순위">
    <div className="score-row score-head" role="row"><span>비교</span><span>순위</span><span>모델</span><span>점수</span><span>변동</span><span>근거</span><span>작업비용</span><span>속도</span><span>신뢰도</span><span /></div>
    {entries.map((entry) => {
      const isOpen = expanded === entry.model.slug; const checked = selected.includes(entry.model.slug);
      return <div className={`score-row-wrap ${isOpen ? "open" : ""}`} key={entry.model.slug}>
        <div className={`score-row ${entry.rank === 1 ? "first" : ""}`} role="row">
          <button className={`compare-check ${checked ? "checked" : ""}`} onClick={() => onSelect(entry.model.slug)} aria-label={`${entry.model.name} 비교 ${checked ? "해제" : "선택"}`} aria-pressed={checked}>{checked && <Check size={13} />}</button>
          <strong className="rank-number">{entry.rank}</strong>
          <Link className="model-cell" href={`/models/${entry.model.slug}`} aria-label={`${entry.model.name} 초보자 가이드 열기`}>
            <ProviderIcon provider={entry.model.provider} /><span><b>{compactName(entry.model.name)}</b><small>{entry.model.provider} · {(entry.model.context / 1000).toLocaleString()}k context</small></span>
          </Link>
          <Link className="score-value" href={`/models/${entry.model.slug}#benchmarks`} title="모델 상세에서 점수와 평가 근거를 확인합니다.">{scoreFormat(entry.value)}</Link>
          <Delta entry={entry} />
          <span className="evidence-count">{Object.keys(entry.components).length}개</span>
          <span className="money">{entry.price === undefined ? "—" : `$${entry.price.toFixed(2)}`}</span>
          <span className="speed">{entry.speed === undefined ? "—" : `${Math.round(entry.speed)} t/s`}</span>
          <span className={`confidence ${entry.confidence === "높음" ? "high" : ""}`}>{entry.confidence ?? "낮음"}</span>
          <button className="expand-button" onClick={() => setExpanded(isOpen ? undefined : entry.model.slug)} aria-label={`${entry.model.name} 근거 ${isOpen ? "닫기" : "열기"}`}><ChevronDown size={16} /></button>
        </div>
        {isOpen && <div className="row-detail" id={`evidence-${entry.model.slug}`}><div className="detail-head"><div><b>{entry.movementReason ?? "변동 근거 없음"}</b><span>커버리지 {Math.round((entry.coverage ?? 0) * 100)}% · 지연 {entry.latency === undefined ? "—" : `${entry.latency.toFixed(2)}초`}</span></div><Link href={`/models/${entry.model.slug}`}>모델 상세 <ExternalLink size={13} /></Link></div><Evidence entry={entry} /></div>}
      </div>;
    })}
  </div>;
}

export function ScoreboardDashboard({ data }: { data: PublicData }) {
  const [active, setActive] = useState<BoardSlug>("overall");
  const [selected, setSelected] = useState<string[]>([]);
  const board = data.snapshot.boards[active];
  const overall = data.snapshot.boards.overall.entries;
  const chartData = useMemo(() => overall.filter((entry) => entry.price !== undefined).map((entry) => ({ name: compactName(entry.model.name), score: entry.value, price: entry.price })), [overall]);
  const toggle = (slug: string) => setSelected((current) => current.includes(slug) ? current.filter((item) => item !== slug) : current.length < 2 ? [...current, slug] : [current[1], slug]);
  return <>
    <div className="board-toolbar">
      <div className="board-tabs" role="tablist" aria-label="리더보드 선택">{boardOrder.map((slug) => <button key={slug} role="tab" aria-selected={active === slug} onClick={() => setActive(slug)}>{boardMeta[slug].label}</button>)}</div>
    </div>
    <section className="main-board" aria-labelledby="board-title"><div className="board-context"><div><p>AI 모델 스코어보드 · {data.snapshot.methodVersion}</p><h1 id="board-title">{board.label} 순위</h1></div><span>{board.description}</span></div><RankTable entries={board.entries} selected={selected} onSelect={toggle} /></section>
    <LatestModelChart />
    <section className="analysis-grid" aria-label="추가 분석">
      <article className="analysis-panel movement-panel"><header><span>24시간 변동</span><b>순위 변화</b></header>{overall.slice(0, 5).map((entry) => <div key={entry.model.slug}><span>{entry.model.name}</span><Delta entry={entry} /></div>)}</article>
      <article className="analysis-panel chart-panel"><header><span>점수 vs 작업 비용</span><b>효율 분포</b></header><div className="scatter-wrap"><ScoreScatterChart data={chartData} /></div></article>
      <article className="analysis-panel source-panel"><header><span>Source status</span><b>수집 상태</b></header><div><span>Artificial Analysis</span><b className="ok">정상</b></div><div><span>OpenRouter</span><b className="ok">정상</b></div><div><span>한국어 독립 평가</span><b className="pending">대기</b></div><small>부분 실패 시 마지막 정상 스냅샷을 유지합니다.</small></article>
    </section>
    {selected.length > 0 && <aside className="compare-tray" aria-live="polite"><GitCompareArrows size={18} aria-hidden="true" /><span>{selected.map((slug) => overall.find((entry) => entry.model.slug === slug)?.model.name).filter(Boolean).join(" · ")}</span><small>{selected.length}/2</small>{selected.length === 2 ? <Link href={`/compare?m=${selected.join(",")}`}>비교하기</Link> : <b>한 모델 더 선택</b>}<button onClick={() => setSelected([])} aria-label="비교 선택 지우기"><X size={16} /></button></aside>}
  </>;
}
