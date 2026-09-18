import Link from "next/link";
import { getBoard, getModel } from "@/lib/catalog";
import { curatedModels } from "@/lib/curated-data";
import type { Model } from "@/lib/types";

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const requested = ((await searchParams).m?.split(",").slice(0, 3).map(getModel).filter((model): model is Model => Boolean(model))) ?? [];
  const compared = requested.length >= 2 ? requested : curatedModels.slice(0, 2);
  const primary = compared[0]!;
  return <main className="shell subpage"><header className="topbar"><Link href="/" className="brand">AI <span>LEADERBOARD</span></Link><nav><Link href="/models">Models</Link><Link href="/boards">Boards</Link></nav></header><p className="eyebrow">MODEL COMPARISON</p><h1>Choose a lens.<br /><em>Keep the evidence.</em></h1><div className="compare-picker">{curatedModels.slice(0, 6).map((model) => <Link key={model.slug} href={`/compare?m=${primary.slug},${model.slug}`} className={compared.some((selectedModel) => selectedModel.slug === model.slug) ? "selected" : ""}>{model.name}</Link>)}</div><div className="compare-table"><div className="compare-row compare-head"><span>Metric</span>{compared.map((model) => <b key={model.slug}>{model.name}</b>)}</div>{(["overall", "coding", "price"] as const).map((slug) => <div className="compare-row" key={slug}><span>{getBoard(slug)!.label}</span>{compared.map((model) => { const entry = getBoard(slug)!.entries.find((item) => item.model.slug === model.slug)!; return <b key={model.slug}>#{entry.rank} <small>{slug === "price" ? `$${entry.value.toFixed(2)}` : entry.value.toFixed(1)}</small></b>; })}</div>)}</div><p className="intro-copy">Comparison is deterministic and reflects the currently published method v1 snapshot. Open a model for source-level evidence.</p></main>;
}
