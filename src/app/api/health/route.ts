import { loadPublicData } from "@/lib/public-data";
export const runtime = "nodejs";
export async function GET() {
  const data = await loadPublicData();
  const cronConfigured = Boolean(process.env.CRON_SECRET);
  const healthy = data.source === "database" && cronConfigured;
  return Response.json({
    status: healthy ? "ok" : "degraded",
    database: data.source === "database" ? "connected" : "unavailable",
    fallbackActive: data.source === "fallback",
    cronConfigured,
    latestSnapshotAt: data.health.latestSnapshotAt,
    lastCronSuccessAt: data.health.lastCronSuccessAt,
    sourceCoverage: data.health.sourceCoverage,
    publishedModels: data.health.publishedModels,
    methodVersion: data.health.methodVersion,
    stale: data.health.stale,
    inputHash: data.snapshot.inputHash,
    notice: data.notice,
  }, { status: healthy ? 200 : 503 });
}
