import { notFound } from "next/navigation";
import { DataStatus } from "@/components/data-status";
import { SiteHeader } from "@/components/site-header";
import { loadPublicData } from "@/lib/public-data";

export default async function ModelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await loadPublicData();
  const overall = data.snapshot.boards.overall.entries.find((entry) => entry.model.slug === slug);
  if (!overall) notFound();
  const model = overall.model;
  const boardEntry = (board: "coding" | "agentic" | "value" | "speed") => data.snapshot.boards[board].entries.find((entry) => entry.model.slug === slug);
  const coding = boardEntry("coding"); const agentic = boardEntry("agentic"); const value = boardEntry("value"); const speed = boardEntry("speed");
  return <main className="shell subpage"><SiteHeader date={data.snapshot.date} /><DataStatus data={data} /><section className="model-hero"><div><p className="eyebrow">{model.provider.toUpperCase()} · {model.lifecycle ?? "published"}</p><h1>{model.name}</h1><p>버전 {model.version} · 컨텍스트 {model.context.toLocaleString()} 토큰 · 출처 기반 관측값</p></div><div className="model-rank"><span>종합 순위</span><strong>#{overall.rank}</strong><small>{overall.value.toFixed(1)}점 · 커버리지 {Math.round((overall.coverage ?? 0) * 100)}%</small></div></section><section className="stat-strip"><div><span>코딩</span><b>{coding ? `#${coding.rank}` : "평가 대기"}</b><small>{coding ? `${coding.value.toFixed(1)}점` : "결측값은 0점 처리하지 않음"}</small></div><div><span>업무·에이전트</span><b>{agentic ? `#${agentic.rank}` : "평가 대기"}</b><small>{agentic ? `${agentic.value.toFixed(1)}점` : "검증 데이터 대기"}</small></div><div><span>작업 비용 / 출력 속도</span><b>{overall.price === undefined ? "—" : `$${overall.price.toFixed(2)}`} / {overall.speed === undefined ? "—" : `${Math.round(overall.speed)} t/s`}</b><small>{value ? `가성비 #${value.rank}` : "가성비 대기"} · {speed ? `속도 #${speed.rank}` : "속도 대기"}</small></div></section><section className="breakdown"><div className="section-head"><div><p className="eyebrow">종합 · {data.snapshot.methodVersion.toUpperCase()}</p><h2>점수 → 정규화 → 원자료</h2></div></div><p className="breakdown-intro">각 leaf는 공개 스냅샷 생성에 실제 사용된 관측값입니다. 출처와 관측일을 함께 보존합니다.</p>{Object.entries(overall.components).map(([label, component]) => <article className="evidence-row" key={label}><div><b>{label}</b><span>원점수 {component.raw.toFixed(1)} → 정규화 {component.normalized.toFixed(1)} / 100 · 실효 가중치 {(component.weight * 100).toFixed(1)}%</span></div><a href={component.source.url} target="_blank" rel="noreferrer">{component.source.label} ↗<small>관측일 {component.source.observedAt}</small></a></article>)}</section></main>;
}
