"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { boardOrder } from "@/lib/board-meta";
import { boardSlug, contextText, displayName, metricText } from "@/lib/presentation";
import type { Snapshot, Model } from "@/lib/types";
import type { ResolvedModelGuide } from "@/lib/model-guide-types";
import { missingMetrics, axisDefinitions } from "@/lib/scoring-method";

export function ModelComparison({ snapshot, models, guides }: { snapshot: Snapshot; models: Model[]; guides: Record<string, Pick<ResolvedModelGuide, "status" | "lastVerifiedAt" | "access">> }) {
  const params = useSearchParams();
  const requested = params.get("m")?.split(",") ?? [];
  const example = !params.has("m");
  const slugs = example ? models.slice(0,2).map((m) => m.slug) : requested.slice(0,2);
  const [queries,setQueries] = useState(["",""]);
  const active = boardSlug(params.get("board"));
  const compared = slugs.map((slug) => models.find((m) => m.slug === slug));
  function update(index: number, slug: string) {
    const next = [...slugs]; next[index] = slug;
    const query = new URLSearchParams(params.toString()); query.set("m",next.join(","));
    window.history.replaceState(null,"",`/compare?${query}`);
  }
  const valid = compared.length === 2 && compared.every(Boolean) && slugs[0] !== slugs[1];
  const entryFor = (model: Model, board = active) => snapshot.boards[board].entries.find((e) => e.model.slug === model.slug);
  const missingFor = (model: Model) => {
    const present = Object.values(entryFor(model)?.components ?? {}).map((c) => c.metricKey).filter((k): k is string => Boolean(k));
    return (active === "overall" ? Object.keys(axisDefinitions).flatMap((a) => missingMetrics(a,present)) : missingMetrics(active,present)).join(", ") || "없음";
  };
  const rows: Array<[string,(m: Model) => string]> = [
    [`${snapshot.boards[active].label} 순위·값`, (m) => { const e=entryFor(m); return e ? `#${e.rank} · ${metricText(e,active,snapshot.methodVersion)}` : "자료 없음"; }],
    ["평가 작업당 비용 (USD)", (m) => { const e=entryFor(m,"overall"); return e?.price === undefined || snapshot.methodVersion !== "v2.1" ? "자료 없음" : `$${e.price.toFixed(2)}`; }],
    ["출력 속도 (토큰/초)", (m) => entryFor(m,"overall")?.speed?.toFixed(1) ?? "자료 없음"],
    ["첫 응답 지연 (초)", (m) => entryFor(m,"overall")?.latency?.toFixed(2) ?? "자료 없음"],
    ["평가 컨텍스트", (m) => contextText(m.context)],
    ["평가 모델명·설정", (m) => m.name],
    ["평가 항목 확보율", (m) => { const e=entryFor(m); return e?.coverage === undefined ? "자료 없음" : `${Math.round(e.coverage*100)}%`; }],
    ["없는 평가 자료", missingFor],
    ["공식 소개 검증", (m) => guides[m.slug]?.status === "published" ? `확인 ${guides[m.slug].lastVerifiedAt}` : "확인 중"],
    ["앱·웹 이용", (m) => guides[m.slug]?.access.filter((p) => ["web","app"].includes(p.kind)).map((p) => `${p.label}: ${p.requirements}`).join(" / ") || "공식 이용 정보 확인 중"],
  ];
  return <>
    {example && <p className="comparison-notice">예시로 현재 종합 순위의 첫 두 모델을 선택했습니다. A와 B를 모두 바꿀 수 있습니다.</p>}
    <div className="comparison-pickers">{[0,1].map((index) => <fieldset key={index}><legend>모델 {index === 0 ? "A" : "B"}</legend><label>이름·개발사로 찾기<input type="search" value={queries[index]} onChange={(e) => setQueries((q) => q.map((value,i) => i === index ? e.target.value : value))} /></label><label>모델 선택<select value={compared[index]?.slug ?? ""} onChange={(e) => update(index,e.target.value)}><option value="">모델 선택</option>{models.filter((m) => m.slug === slugs[index] || `${m.name} ${m.provider}`.toLowerCase().includes(queries[index].toLowerCase().trim())).map((m) => <option key={m.slug} value={m.slug}>{displayName(m.name)} · {m.provider}</option>)}</select></label></fieldset>)}</div>
    <label className="comparison-field">비교 분야<select value={active} onChange={(e) => { const query = new URLSearchParams(params.toString()); query.set("board", e.target.value); window.history.replaceState(null,"",`/compare?${query}`); }}>{boardOrder.map((b) => <option key={b} value={b}>{snapshot.boards[b].label}</option>)}</select></label>
    {!valid ? <p role="alert">서로 다른 공개 모델 두 개를 선택하세요. 현재 목록에 없는 모델은 비교할 수 없습니다.</p> : <>
      <p>{snapshot.boards[active].description}</p>
      <table className="comparison-table"><caption className="sr-only">모델 A와 B 비교 · {snapshot.date}</caption><thead><tr><th scope="col">항목</th>{compared.map((m) => <th scope="col" key={m!.slug}><Link href={`/models/${m!.slug}?board=${active}`}>{displayName(m!.name)}</Link></th>)}</tr></thead><tbody>
        {rows.map(([label,fn]) => <tr key={label}><th scope="row">{label}</th>{compared.map((m) => <td key={m!.slug}>{fn(m!)}</td>)}</tr>)}
        <tr><th scope="row">평가 구성·출처</th>{compared.map((m) => <td key={m!.slug}><ul>{Object.entries(entryFor(m!)?.components ?? {}).map(([label,c]) => <li key={label}><a href={c.source.url} target="_blank" rel="noreferrer">{label} ↗</a><small>{c.source.observedAt} · 반영 {(c.weight*100).toFixed(1)}%</small></li>)}</ul></td>)}</tr>
      </tbody></table>
      {(() => {
        const a=entryFor(compared[0]!); const b=entryFor(compared[1]!);
        if(!a || !b) return null;
        if(active==="value" && snapshot.methodVersion!=="v2.1") return null;
        const left=active==="value" ? a.price : active==="speed" ? a.speed : a.value;
        const right=active==="value" ? b.price : active==="speed" ? b.speed : b.value;
        if(left===undefined || right===undefined) return null;
        return <p className="comparison-notice">A−B 차이 {(left-right).toFixed(2)}{active==="value" ? " USD/평가 작업" : active==="speed" ? " 토큰/초" : "점"}. 평가 구성·확보율이 다르면 직접적인 우열로 해석하기 어렵습니다.</p>;
      })()}
      <p className="detail-meta">평가 작업 비용은 API 토큰 단가·앱 구독료와 다릅니다. 확보율은 공식 정보 검증률이나 통계적 신뢰도가 아닙니다. 실제 이용 조건과 가격은 각 모델 상세에서 확인하세요.</p>
    </>}
  </>;
}
