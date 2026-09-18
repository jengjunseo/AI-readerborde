import Link from "next/link";
import { curatedModels } from "@/lib/curated-data";

export default function ModelsPage() {
  return <main className="shell subpage"><header className="topbar"><Link href="/" className="brand">AI <span>LEADERBOARD</span></Link><nav><Link href="/boards">Boards</Link><Link href="/compare">Compare</Link></nav></header><p className="eyebrow">MODEL CATALOG</p><h1>One identity,<br /><em>many evidence leaves.</em></h1><div className="board-index">{curatedModels.map((model) => <Link href={`/models/${model.slug}`} key={model.slug}><p>{model.provider.toUpperCase()}</p><h2>{model.name}</h2><span>{model.version} · {model.context.toLocaleString()} context</span><b>Inspect evidence →</b></Link>)}</div></main>;
}
