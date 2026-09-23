import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { AlertTriangle, ArrowLeft, BookOpen, CheckCircle2, CircleDollarSign, Code2, Download, ExternalLink, Globe2, Laptop, ShieldCheck, Sparkles } from "lucide-react";
import { DataStatus } from "@/components/data-status";
import { GlossaryNotes, GlossaryText } from "@/components/glossary-notes";
import { ProviderIcon } from "@/components/provider-icon";
import { SiteHeader } from "@/components/site-header";
import { getDb } from "@/db/client";
import { models, modelVersions, providers } from "@/db/schema";
import { glossaryEntries } from "@/lib/glossary";
import { loadPublishedModelGuide } from "@/lib/model-guide-store";
import { modelGuideFamilies, modelVersionGuides, resolveModelGuide } from "@/lib/model-guides";
import type { GuideSource, ResolvedModelGuide } from "@/lib/model-guide-types";
import { loadPublicData } from "@/lib/public-data";
import type { RankedEntry } from "@/lib/types";

const boardLabels = { overall: "종합", coding: "코딩", agentic: "업무·에이전트", value: "가성비", speed: "속도", korean: "한국어" } as const;

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
  const boardEntries = Object.fromEntries(Object.entries(data.snapshot.boards).map(([key, board]) => [key, board.entries.find((entry) => entry.model.slug === slug)])) as Record<keyof typeof boardLabels, RankedEntry | undefined>;
  return { data, model, guide, boardEntries };
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadModelPage(slug);
  if (!page) return { title: "모델을 찾을 수 없음 · AI SCOREBOARD" };
  return { title: `${page.guide.officialName} 사용법·가격·평가 | AI SCOREBOARD`, description: page.guide.summary };
}

function SourceRefs({ ids, sources }: { ids: string[]; sources: GuideSource[] }) {
  const matched = ids.map((id) => sources.find((item) => item.id === id)).filter((item): item is GuideSource => Boolean(item));
  if (!matched.length) return null;
  return <span className="guide-source-refs" aria-label="이 설명의 출처">{matched.map((item, index) => <a key={item.id} href={`#source-${item.id}`}>{index ? " · " : ""}근거 {sources.findIndex((candidate) => candidate.id === item.id) + 1}</a>)}</span>;
}

function SectionTitle({ title }: { title: string }) {
  return <header className="guide-section-title"><h2>{title}</h2></header>;
}

function AccessIcon({ kind }: { kind: ResolvedModelGuide["access"][number]["kind"] }) {
  if (kind === "api") return <Code2 aria-hidden="true" />;
  if (kind === "local") return <Download aria-hidden="true" />;
  if (kind === "app") return <Laptop aria-hidden="true" />;
  return <Globe2 aria-hidden="true" />;
}

function AccessGuide({ guide }: { guide: ResolvedModelGuide }) {
  if (!guide.access.length) return <div className="guide-pending"><AlertTriangle aria-hidden="true" /><div><b>이용 방법을 확인하고 있습니다.</b><p>공식 서비스, API와 요금제 정보가 검증되기 전에는 링크나 사용 방법을 추측해서 표시하지 않습니다.</p></div></div>;
  return <div className="access-list">{guide.access.map((path, index) => <article className="access-path" key={`${path.kind}-${path.label}`}>
    <div className="access-order">{index + 1}</div><div className="access-main"><header><span className="access-icon"><AccessIcon kind={path.kind} /></span><div><h3>{path.label}</h3><p>{path.platform}</p></div><div className="access-badges"><span>{path.technicalLevel}</span><span className={`free-${path.freeAccess}`}>{path.freeAccess === "yes" ? "무료 다운로드" : path.freeAccess === "limited" ? "무료 한도 있음" : path.freeAccess === "no" ? "유료" : "조건 확인"}</span></div></header><p className="access-requirement"><GlossaryText text={path.requirements} /></p><ol>{path.steps.map((step) => <li key={step}><GlossaryText text={step} /></li>)}</ol><a className="official-link" href={path.url} target="_blank" rel="noreferrer">공식 페이지에서 시작하기 <ExternalLink size={14} aria-hidden="true" /></a><SourceRefs ids={path.sourceIds} sources={guide.sources} /></div>
  </article>)}</div>;
}

function Benchmarks({ entry, methodVersion }: { entry?: RankedEntry; methodVersion: string }) {
  if (!entry) return <div className="guide-pending"><BookOpen aria-hidden="true" /><div><b>현재 공개 스냅샷에 평가값이 없습니다.</b><p>과거에 등장한 모델의 소개 페이지는 유지하지만, 결측값을 0점이나 임의 평균으로 채우지 않습니다.</p></div></div>;
  return <><div className="benchmark-summary"><div><span>종합 순위</span><strong>#{entry.rank}</strong></div><div><span>종합 점수</span><strong>{entry.value.toFixed(1)}</strong></div><div><span>데이터 커버리지</span><strong>{Math.round((entry.coverage ?? 0) * 100)}%</strong></div><div><span>계산 방법</span><strong>{methodVersion.toUpperCase()}</strong></div></div><div className="benchmark-leaves">{Object.entries(entry.components).map(([label, component]) => <article key={label}><div><b>{label}</b><span>실효 가중치 {(component.weight * 100).toFixed(1)}%</span></div><div className="metric-chain"><span>원점수 <b>{component.raw.toFixed(1)}</b></span><i>→</i><span>정규화 <b>{component.normalized.toFixed(1)}</b> / 100</span></div><a href={component.source.url} target="_blank" rel="noreferrer">{component.source.label} <ExternalLink size={12} aria-hidden="true" /><small>관측일 {component.source.observedAt}</small></a></article>)}</div></>;
}

export default async function ModelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await loadModelPage(slug);
  if (!page) notFound();
  const { data, model, guide, boardEntries } = page;
  const glossaryItems = glossaryEntries(guide.glossaryTerms);
  return <main className="shell subpage model-guide-page"><GlossaryNotes entries={glossaryItems}>
    <SiteHeader date={data.snapshot.date} /><DataStatus data={data} />
    <div className="model-breadcrumb"><Link href="/"><ArrowLeft size={14} aria-hidden="true" /> 리더보드로 돌아가기</Link></div>
    <section className="guide-hero"><div className="guide-hero-copy"><div className="guide-provider"><ProviderIcon provider={model.provider} /><span>{model.provider}</span><i>·</i><span>{guide.status === "published" ? "검증된 안내" : "정보 확인 중"}</span></div><h1>{guide.officialName}</h1><p className="guide-summary"><GlossaryText text={guide.summary} /></p><div className="guide-meta"><span>{guide.modelType}</span><span>출시 {guide.releaseDate ?? model.releaseDate ?? "공식 확인 중"}</span><span>버전 {model.version}</span></div>{guide.configurationNote && <p className="configuration-note"><Sparkles size={15} aria-hidden="true" /><span><GlossaryText text={guide.configurationNote} /></span></p>}</div><aside className="guide-rank"><span>현재 종합 순위</span><strong>{boardEntries.overall ? `#${boardEntries.overall.rank}` : "—"}</strong><p>{boardEntries.overall ? `${boardEntries.overall.value.toFixed(1)}점 · ${data.snapshot.date}` : "현재 순위 없음"}</p><Link href="#benchmarks">평가 근거 보기 ↓</Link></aside></section>
    <nav className="guide-jump" aria-label="모델 가이드 목차"><a href="#about">소개</a><a href="#use-cases">활용</a><a href="#how-to-use">사용 방법</a><a href="#pricing">가격</a><a href="#considerations">장단점</a>{guide.openWeights && <a href="#open-weights">직접 실행</a>}<a href="#benchmarks">평가 근거</a></nav>
    <div className="guide-layout"><div className="guide-content">
      <section id="about" className="guide-section"><SectionTitle title="이 AI는 무엇인가요?" /><p className="guide-introduction"><GlossaryText text={guide.introduction} /></p><div className="capability-list">{guide.capabilities.map((item) => <span key={item}><CheckCircle2 size={14} aria-hidden="true" /><GlossaryText text={item} /></span>)}</div></section>
      <section id="use-cases" className="guide-section"><SectionTitle title="어떤 작업에 사용할 수 있나요?" /><div className="guide-list">{guide.useCases.length ? guide.useCases.map((item) => <article key={item.title}><h3>{item.title}</h3><p><GlossaryText text={item.description} /></p><SourceRefs ids={item.sourceIds} sources={guide.sources} /></article>) : <div className="guide-pending"><AlertTriangle aria-hidden="true" /><div><b>활용 사례 확인 중</b><p>검증된 공식 자료가 확보되면 공개합니다.</p></div></div>}</div></section>
      <section id="how-to-use" className="guide-section"><SectionTitle title="어디에서, 어떻게 사용하나요?" /><AccessGuide guide={guide} /></section>
      <section id="pricing" className="guide-section"><SectionTitle title="무료인가요? 얼마인가요?" />{guide.prices.length ? <div className="price-list">{guide.prices.map((item) => <article key={`${item.label}-${item.billingType}`}><div><CircleDollarSign aria-hidden="true" /><span><b>{item.label}</b><small>{item.billingType === "api" ? "API 종량제" : item.billingType === "subscription" ? "서비스 구독" : item.billingType === "open-weights" ? "오픈 웨이트" : "외부 제공"}</small></span></div><strong>{item.price}</strong><p><GlossaryText text={`${item.unit}${item.note ? ` · ${item.note}` : ""}`} /></p><small>확인일 {item.observedAt}</small><SourceRefs ids={item.sourceIds} sources={guide.sources} /></article>)}</div> : <div className="guide-pending"><AlertTriangle aria-hidden="true" /><div><b>공식 가격 확인 필요</b><p>가격이 검증되기 전까지 임의의 금액을 표시하지 않습니다.</p></div></div>}</section>
      <section id="considerations" className="guide-section"><SectionTitle title="장점과 알아둘 점" /><div className="pros-cons"><div><h3><CheckCircle2 aria-hidden="true" />장점</h3>{guide.strengths.map((item) => <article key={item.title}><b>{item.title}</b><p><GlossaryText text={item.description} /></p><SourceRefs ids={item.sourceIds} sources={guide.sources} /></article>)}</div><div><h3><AlertTriangle aria-hidden="true" />알아둘 점</h3>{guide.cautions.map((item) => <article key={item.title}><b>{item.title}</b><p><GlossaryText text={item.description} /></p><SourceRefs ids={item.sourceIds} sources={guide.sources} /></article>)}</div></div></section>
      {guide.openWeights && <section id="open-weights" className="guide-section"><SectionTitle title="직접 내려받아 실행하려면" /><div className="open-weight-intro"><ShieldCheck aria-hidden="true" /><div><b>{guide.openWeights.license}</b><p><GlossaryText text={guide.openWeights.meaning} /></p><a href={guide.openWeights.licenseUrl} target="_blank" rel="noreferrer">라이선스 원문 <ExternalLink size={13} /></a></div></div><dl className="hardware-grid"><div><dt>모델 크기</dt><dd><GlossaryText text={guide.openWeights.parameterScale} /></dd></div><div><dt>정밀도</dt><dd><GlossaryText text={guide.openWeights.precisions} /></dd></div><div><dt>가중치 메모리</dt><dd><GlossaryText text={guide.openWeights.estimatedWeightMemory} /></dd></div><div><dt>실행 중 추가 메모리</dt><dd><GlossaryText text={guide.openWeights.runtimeMemoryNote} /></dd></div><div><dt>CPU와 GPU</dt><dd><GlossaryText text={guide.openWeights.cpuGpuNote} /></dd></div></dl><ol className="local-steps">{guide.openWeights.steps.map((step) => <li key={step}><GlossaryText text={step} /></li>)}</ol><div className="tool-links"><a href={guide.openWeights.downloadUrl} target="_blank" rel="noreferrer"><Download size={14} />공식 가중치</a>{guide.openWeights.tools.map((tool) => <a key={tool.name} href={tool.url} target="_blank" rel="noreferrer">{tool.name}<ExternalLink size={12} /></a>)}</div></section>}
      <section id="benchmarks" className="guide-section"><SectionTitle title="벤치마크 및 평가 근거" /><div className="rank-pills">{Object.entries(boardEntries).map(([key, entry]) => <span key={key}><small>{boardLabels[key as keyof typeof boardLabels]}</small><b>{entry ? `#${entry.rank} · ${entry.value.toFixed(1)}` : "평가 대기"}</b></span>)}</div><Benchmarks entry={boardEntries.overall} methodVersion={data.snapshot.methodVersion} /></section>
      <section id="references" className="guide-section references-section"><SectionTitle title="참고 자료와 확인일" />{guide.sources.length ? <ol>{guide.sources.map((item, index) => <li id={`source-${item.id}`} key={item.id}><span>{index + 1}</span><div><b>{item.label}</b><small>{item.kind} · 확인일 {item.verifiedAt}</small></div><a href={item.url} target="_blank" rel="noreferrer">원문 <ExternalLink size={12} /></a></li>)}</ol> : <div className="guide-pending"><AlertTriangle aria-hidden="true" /><div><b>검증 자료 수집 중</b><p>현재는 리더보드의 모델 정보만 확인됐습니다.</p></div></div>}</section>
    </div></div>
  </GlossaryNotes></main>;
}
