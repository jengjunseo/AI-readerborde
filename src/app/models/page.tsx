import { DataStatus } from "@/components/data-status";
import { SiteHeader } from "@/components/site-header";
import { ModelIndex } from "@/components/model-index";
import { loadPublicData, modelsFromSnapshot } from "@/lib/public-data";
export default async function ModelsPage() {
  const data = await loadPublicData();
  return <main className="shell subpage"><SiteHeader date={data.snapshot.date} />{data.health.stale && <DataStatus data={data} />}<h1 className="page-title">모델 찾기</h1><ModelIndex models={modelsFromSnapshot(data.snapshot)} /></main>;
}
