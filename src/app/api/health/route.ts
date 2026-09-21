import { loadPublicData } from "@/lib/public-data";
export const runtime = "nodejs";
export async function GET() {
  const data = await loadPublicData();
  const cronConfigured = Boolean(process.env.CRON_SECRET);
  const healthy = data.source === "database" && cronConfigured;
  return Response.json({
    status: healthy ? "ok" : "degraded",
    dataSource: data.source,
    cronConfigured,
    snapshot: data.snapshot.date,
    methodVersion: data.snapshot.methodVersion,
    inputHash: data.snapshot.inputHash,
    notice: data.notice,
  }, { status: healthy ? 200 : 503 });
}
