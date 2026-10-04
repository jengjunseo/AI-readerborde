import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { SiteHeader } from "@/components/site-header";
import { DataStatus } from "@/components/data-status";
import { GlossaryNotes, GlossaryTerms, GlossaryText } from "@/components/glossary-notes";
import { ProviderIcon } from "@/components/provider-icon";
import { getDb } from "@/db/client";
import { models, modelVersions, providers } from "@/db/schema";
import { glossaryEntries } from "@/lib/glossary";
import { loadPublishedModelGuide } from "@/lib/model-guide-store";
import { modelGuideFamilies, modelVersionGuides, resolveModelGuide } from "@/lib/model-guides";
import type { GuideSource, ResolvedModelGuide } from "@/lib/model-guide-types";
import { loadPublicData } from "@/lib/public-data";
import { pricesFor } from "@/lib/guide-presentation";
import { boardMeta, boardOrder } from "@/lib/board-meta";
import { boardSlug, contextText, displayName, evaluationSetting, metricText, safeReturn } from "@/lib/presentation";
import { axisDefinitions, missingMetrics } from "@/lib/scoring-method";
import type { BoardSlug, RankedEntry } from "@/lib/types";

const loadModelPage = cache(async (slug: string) => {
  const data = await loadPublicData();
  const current = data.snapshot.boards.overall.entries.find((entry) => entry.model.slug === slug);
  let model = current?.model;
  const db = getDb();
  if (!model && db) {
    try {
      const identity = (await db.select({ slug: models.slug, name: models.name, provider: providers.name, version: modelVersions.version, context: modelVersions.contextLength, releaseDate: models.releaseDate, lifecycle: models.lifecycle })
        .from(models).innerJoin(providers, eq(models.providerId, providers.id)).innerJoin(modelVersions, eq(modelVersions.modelId, models.id))
        .where(and(eq(models.slug, slug), eq(modelVersions.isCurrent, true))).limit(1))[0];
      if (identity) model = { slug: identity.slug, name: identity.name, provider: identity.provider, version: identity.version, context: Number(identity.context), releaseDate: identity.releaseDate ?? undefined, lifecycle: identity.lifecycle, inputPrice: 0, outputPrice: 0, priceSource: { label: "확인 중", url: "#references", observedAt: "UNKNOWN", tier: "T3" }, metrics: {} };
    } catch { /* Public data fallback still renders current models. */ }
  }
  if (!model) {
    const verified = modelVersionGuides[slug];
    const family = verified ? modelGuideFamilies[verified.familyKey] : undefined;
    if (verified && family) model = { slug, name: verified.officialName, provider: family.provider, version: slug, context: verified.contextTokens ?? 0, releaseDate: verified.releaseDate, lifecycle: "verified", inputPrice: 0, outputPrice: 0, priceSource: { label: "공식 모델 문서", url: verified.sources[0]?.url ?? "#references", observedAt: verified.lastVerifiedAt, tier: "T1" }, metrics: {} };
  }
  if (!model) return undefined;
  let guide = resolveModelGuide(model);
  if (db) {
    try { guide = await loadPublishedModelGuide(db, model) ?? guide; } catch { /* Code-reviewed catalog remains the safe fallback. */ }
  }
  const boardEntries = Object.fromEntries(Object.entries(data.snapshot.boards).map(([key, board]) => [key, board.entries.find((entry) => entry.model.slug === slug)])) as Record<BoardSlug, RankedEntry | undefined>;
  return { data, model, guide, boardEntries };
});


export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = await loadModelPage((await params).slug);
  return { title: page ? `${page.guide.officialName} 사용법·가격·평가 | AI SCOREBOARD` : "모델을 찾을 수 없음", description: page?.guide.summary };
}

function Sources({ ids, sources }: { ids: string[]; sources: GuideSource[] }) {
  return <span className="detail-sources">{ids.map((id) => sources.find((s) => s.id === id)).filter((s): s is GuideSource => Boolean(s)).map((s) =>
    <a key={s.id} href={s.url} target="_blank" rel="noreferrer">{s.label} ↗ <small>확인 {s.verifiedAt}</small></a>)}</span>;
}

function Access({ guide }: { guide: ResolvedModelGuide }) {
  return <div className="detail-access">{guide.access.map((path) => <article key={path.label}>
    <h3>{path.label}</h3><p className="detail-meta">{path.platform} · {path.technicalLevel} · {path.freeAccess === "no" ? "유료 이용" : path.freeAccess === "limited" ? "무료 한도 있음" : path.freeAccess === "yes" ? path.kind === "local" ? "무료 다운로드 · 실행 비용 별도" : "무료 이용 가능" : "무료 여부 확인 필요"}</p>
    <p><GlossaryText text={path.requirements} /></p>
    {pricesFor(guide, path).length ? pricesFor(guide, path).map((p) => <div className="access-price" key={p.label}><b>{p.price}</b><p><GlossaryText text={`${p.unit}${p.note ? ` · ${p.note}` : ""}`} /></p><small>가격 확인 {p.observedAt}</small><Sources ids={p.sourceIds} sources={guide.sources} /></div>) : <p className="detail-meta">공식 가격·이용 한도는 아래 이용 페이지에서 확인하세요.</p>}
    <ol>{path.steps.map((step) => <li key={step}><GlossaryText text={step} /></li>)}</ol>
    <a className="detail-action" href={path.url} target="_blank" rel="noreferrer">{path.label} 이용 페이지 ↗</a>
    <Sources ids={path.sourceIds} sources={guide.sources} />
  </article>)}</div>;
}

function Evidence({ entry, slug, methodVersion }: { entry?: RankedEntry; slug: BoardSlug; methodVersion: string }) {
  if (!entry) return <p>현재 이 분야의 평가 자료가 없습니다. 0점으로 처리하지 않습니다.</p>;
  const keys = Object.values(entry.components).map((c) => c.metricKey).filter((k): k is string => Boolean(k));
  const missing = slug === "overall" ? Object.keys(axisDefinitions).flatMap((axis) => missingMetrics(axis, keys)) : missingMetrics(slug, keys);
  return <>
    <p>평가 항목 확보율 {Math.round((entry.coverage ?? 0) * 100)}%. {slug === "overall" ? "평가가 있는 축의 기본 가중치 합입니다. 축 안의 일부 자료가 없어도 해당 축은 포함됩니다." : "해당 분야의 전체 평가 항목 중 확보한 항목 비율입니다."} 공식 소개 검증률이나 통계적 신뢰 수준을 뜻하지 않습니다.</p>
    {methodVersion === "v2.1" && <p className="detail-meta">없는 자료: {missing.length ? missing.join(", ") : "없음"}. 남은 자료의 가중치를 다시 나눕니다. 모델마다 평가 구성이 다를 수 있어 작은 점수 차이를 확실한 우열로 해석하지 마세요.</p>}
    <div className="evidence-scroll"><table className="evidence-table"><caption className="sr-only">{boardMeta[slug].label} 원점수와 평가 출처</caption><thead><tr><th scope="col">평가</th><th scope="col">원점수</th><th scope="col">관측일·출처</th></tr></thead><tbody>{Object.entries(entry.components).map(([label, c]) =>
      <tr key={label}><th scope="row">{label}<small>{c.benchmarkVersion ? `버전 ${c.benchmarkVersion}` : "평가 버전 미기록"}</small></th><td>{c.raw.toLocaleString("ko-KR", { maximumFractionDigits: 3 })} <small>{c.unit ?? "원자료 단위"}</small></td><td><a href={c.source.url} target="_blank" rel="noreferrer">{c.source.label} ↗</a><small>{c.source.observedAt}</small></td></tr>)}</tbody></table></div>
    <details><summary>0–100 환산 점수와 실제 반영 비율</summary><ul className="calculation-list">{Object.entries(entry.components).map(([label,c]) => <li key={label}><b>{label}</b>: 환산 {c.normalized.toFixed(2)} / 100 · 반영 {(c.weight * 100).toFixed(2)}%</li>)}</ul><Link href="/methodology">환산 기준·결측 자료 처리</Link></details>
  </>;
}

export default async function ModelPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ board?: string; return?: string }> }) {
  const page = await loadModelPage((await params).slug);
  if (!page) notFound();
  const { data, model, guide, boardEntries } = page;
  const query = await searchParams;
  const active = boardSlug(query.board);
  const setting = evaluationSetting(model.name);
  const pending = guide.status !== "published";
  return <main className="shell subpage model-detail"><GlossaryNotes entries={glossaryEntries(guide.glossaryTerms)}>
    <SiteHeader date={data.snapshot.date} />{data.health.stale && <DataStatus data={data} />}
    <Link className="detail-back" href={safeReturn(query.return)}>← 리더보드로 돌아가기</Link>
    <header className="detail-summary"><p className="detail-provider"><ProviderIcon provider={model.provider} />{model.provider}</p><h1>{pending ? displayName(model.name) : guide.officialName}</h1>
      {!pending && <p><GlossaryText text={guide.summary} /></p>}
      <p className="detail-meta">{!pending && guide.releaseDate ? `출시 ${guide.releaseDate} · ` : ""}평가에 등록된 컨텍스트 {contextText(model.context)}</p>
      {setting && <p className="detail-meta">평가 설정: {setting}</p>}
      {!pending && (guide.configurationNote || guide.contextTokens) && <details><summary>제품명·평가 설정·입력 한도</summary>{guide.configurationNote && <p><GlossaryText text={guide.configurationNote} /></p>}{guide.contextTokens && <p>공식 안내의 모델 컨텍스트: {contextText(guide.contextTokens)}. 위의 {contextText(model.context)}는 외부 평가에 등록된 값입니다.<Sources ids={guide.sources.filter((s) => s.kind === "documentation").map((s) => s.id)} sources={guide.sources} /></p>}<p>실제 앱·API 이용 한도는 제품과 요금제에 따라 다를 수 있습니다.</p></details>}
    </header>
    <section className="detail-section active-result"><h2>{boardMeta[active].label} 평가</h2>{boardEntries[active] ? <p><strong>#{boardEntries[active]!.rank} · {metricText(boardEntries[active]!, active, data.snapshot.methodVersion)}</strong><span> · {data.snapshot.date} · {data.snapshot.methodVersion}</span></p> : <p>이 분야의 평가 자료가 없습니다.</p>}{active !== "overall" && boardEntries.overall && <p className="detail-meta">종합 지수는 #{boardEntries.overall.rank} · {boardEntries.overall.value.toFixed(1)}점 (능력·비용·속도 합산)입니다.</p>}<a href="#benchmarks">점수·출처 보기 ↓</a></section>
    {pending ? <section className="detail-section pending-notice"><h2>공식 소개·이용 정보 확인 중</h2><p>현재 확인된 정보는 외부 평가에 등록된 이름, 개발사와 평가값입니다. 공식 사용 경로·가격·기능은 아직 검증하지 않았습니다. 평가에 등재됐다고 공식 앱에서 제공된다는 뜻은 아닙니다.</p></section> : <>
      {guide.useCases.length > 0 && <section className="detail-section"><h2>어떤 작업에 사용할 수 있나요?</h2><ul className="detail-list">{guide.useCases.map((item) => <li key={item.title}><b>{item.title}</b><p><GlossaryText text={item.description} /></p><Sources ids={item.sourceIds} sources={guide.sources} /></li>)}</ul></section>}
      <section className="detail-section" id="how-to-use"><h2>어디에서, 어떻게 사용하나요? 비용은?</h2>{guide.access.length ? <Access guide={guide} /> : <p>공식 사용 경로와 가격을 확인하고 있습니다.</p>}</section>
      {guide.cautions.length > 0 && <section className="detail-section"><h2>알아둘 점</h2><ul className="detail-list">{guide.cautions.map((item) => <li key={item.title}><b>{item.title}</b><p><GlossaryText text={item.description} /></p><Sources ids={item.sourceIds} sources={guide.sources} /></li>)}</ul></section>}
      {guide.openWeights && <section className="detail-section"><h2>직접 내려받아 실행하려면</h2><p><GlossaryText text={guide.openWeights.meaning} /></p><p><b>{guide.openWeights.license}</b></p><a className="detail-action" href={guide.openWeights.licenseUrl} target="_blank" rel="noreferrer">라이선스 원문 ↗</a><details><summary>서버 준비·메모리·설치 방법</summary><dl className="local-specs">{[
        ["모델 크기",guide.openWeights.parameterScale],["정밀도",guide.openWeights.precisions],["추정 가중치 메모리",guide.openWeights.estimatedWeightMemory],["실행 중 추가 메모리",guide.openWeights.runtimeMemoryNote],["CPU와 GPU",guide.openWeights.cpuGpuNote],
      ].map(([label,text]) => <div key={label}><dt>{label}</dt><dd><GlossaryText text={text} /></dd></div>)}</dl><ol>{guide.openWeights.steps.map((step) => <li key={step}><GlossaryText text={step} /></li>)}</ol><a className="detail-action" href={guide.openWeights.downloadUrl} target="_blank" rel="noreferrer">공식 가중치 ↗</a>{guide.openWeights.tools.map((tool) => <a className="detail-action" key={tool.name} href={tool.url} target="_blank" rel="noreferrer">{tool.name} 설치 문서 ↗</a>)}<Sources ids={guide.openWeights.sourceIds} sources={guide.sources} /></details></section>}
      <section className="detail-section"><h2>용어 풀이</h2><GlossaryTerms /></section>
    </>}
    <section className="detail-section" id="benchmarks"><h2>벤치마크와 평가 근거</h2><p className="detail-meta">{data.snapshot.methodVersion === "v2.1" ? "아래 관측일은 원자료를 수집한 날짜(UTC)입니다. 실제 평가 시행일은 원본이 제공하는 경우에만 알 수 있습니다." : "아래 관측일은 당시 원자료에 기록된 날짜입니다."} 순위의 KST 기준 날짜·소개 확인일과 다를 수 있습니다.</p><Evidence entry={boardEntries[active]} slug={active} methodVersion={data.snapshot.methodVersion} />
      {boardOrder.filter((slug) => slug !== active).map((slug) => <details key={slug}><summary>{boardMeta[slug].label}{boardEntries[slug] ? ` · #${boardEntries[slug]!.rank} · ${metricText(boardEntries[slug]!, slug, data.snapshot.methodVersion)}` : " · 자료 없음"}</summary><Evidence entry={boardEntries[slug]} slug={slug} methodVersion={data.snapshot.methodVersion} /></details>)}
    </section>
    {!pending && <section className="detail-section" id="references"><h2>참고 자료</h2><ul className="reference-list">{guide.sources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a><small>{source.kind} · 확인 {source.verifiedAt}</small></li>)}</ul><p className="detail-meta">소개 확인 {guide.lastVerifiedAt}. 요금제는 수동 검증하며 실시간으로 갱신하지 않습니다.</p></section>}
  </GlossaryNotes></main>;
}
