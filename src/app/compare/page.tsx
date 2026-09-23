import Link from "next/link";
import { DataStatus } from "@/components/data-status";
import { SiteHeader } from "@/components/site-header";
import { loadPublicData, modelsFromSnapshot } from "@/lib/public-data";
import type { Model } from "@/lib/types";

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const data = await loadPublicData(); const models = modelsFromSnapshot(data.snapshot);
  const getModel = (slug: string) => models.find((model) => model.slug === slug);
  const requested = ((await searchParams).m?.split(",").slice(0, 3).map(getModel).filter((model): model is Model => Boolean(model))) ?? [];
  const compared = requested.length >= 2 ? requested : models.slice(0, 2);
  const primary = compared[0]!;
  return <main className="shell subpage"><SiteHeader date={data.snapshot.date} /><DataStatus data={data} /><p className="eyebrow page-kicker">모델 비교</p><h1>같은 기준으로 비교합니다.</h1><div className="compare-picker">{models.slice(0, 12).filter((model) => model.slug !== primary.slug).map((model) => <Link key={model.slug} href={`/compare?m=${primary.slug},${model.slug}`} className={compared.some((selectedModel) => selectedModel.slug === model.slug) ? "selected" : ""}>{model.name}</Link>)}</div><div className="compare-table"><div className="compare-row compare-head"><span>지표</span>{compared.map((model) => <b key={model.slug}>{model.name}</b>)}</div>{(["overall", "coding", "agentic", "value", "speed", "korean"] as const).map((slug) => <div className="compare-row" key={slug}><span>{data.snapshot.boards[slug].label}</span>{compared.map((model) => { const entry = data.snapshot.boards[slug].entries.find((item) => item.model.slug === model.slug); return <b key={model.slug}>{entry ? <>#{entry.rank} <small>{entry.value.toFixed(1)}</small></> : "평가 대기"}</b>; })}</div>)}</div></main>;
}
