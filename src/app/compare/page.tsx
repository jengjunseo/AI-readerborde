import { Suspense } from "react";
import { DataStatus } from "@/components/data-status";
import { SiteHeader } from "@/components/site-header";
import { ModelComparison } from "@/components/model-comparison";
import { loadPublicData, modelsFromSnapshot } from "@/lib/public-data";
import { resolveModelGuide } from "@/lib/model-guides";
import { getDb } from "@/db/client";
import { loadPublishedModelGuides } from "@/lib/model-guide-store";
export default async function ComparePage() {
  const data = await loadPublicData(); const models = modelsFromSnapshot(data.snapshot); const db=getDb();
  let published = {} as Awaited<ReturnType<typeof loadPublishedModelGuides>>;
  if(db) { try { published=await loadPublishedModelGuides(db,models); } catch { /* reviewed catalog fallback */ } }
  const guides = Object.fromEntries(models.map((m) => {
    const guide=published[m.slug] ?? resolveModelGuide(m);
    return [m.slug,{ status:guide.status, lastVerifiedAt:guide.lastVerifiedAt, access:guide.access }];
  }));
  return <main className="shell subpage compare-page"><SiteHeader date={data.snapshot.date} />{data.health.stale && <DataStatus data={data} />}<h1 className="page-title">두 모델 비교</h1><Suspense fallback={<p>비교 불러오는 중…</p>}><ModelComparison snapshot={data.snapshot} models={models} guides={guides} /></Suspense></main>;
}
