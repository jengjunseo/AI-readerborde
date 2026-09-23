import Link from "next/link";
import { DataStatus } from "@/components/data-status";
import { SiteHeader } from "@/components/site-header";
import { loadPublicData, modelsFromSnapshot } from "@/lib/public-data";

export default async function ModelsPage() {
  const data = await loadPublicData(); const models = modelsFromSnapshot(data.snapshot);
  return <main className="shell subpage"><SiteHeader date={data.snapshot.date} /><DataStatus data={data} /><p className="eyebrow page-kicker">모델 목록</p><h1>모델별 설명과 평가를 모았습니다.</h1><div className="board-index">{models.map((model) => <Link href={`/models/${model.slug}`} key={model.slug}><p>{model.provider.toUpperCase()}</p><h2>{model.name}</h2><span>{model.version} · 컨텍스트 {model.context.toLocaleString()} 토큰</span><b>설명과 평가 보기 →</b></Link>)}</div></main>;
}
