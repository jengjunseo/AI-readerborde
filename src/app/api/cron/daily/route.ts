import { getDb } from "@/db/client";
import { curatedAdapter } from "@/ingest/adapters/curated";
import { openRouterAdapter } from "@/ingest/adapters/openrouter";
import { runDailyPipeline } from "@/ingest/pipeline/runner";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ status: "configuration_error", detail: "CRON_SECRET is required" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  const db = getDb();
  if (!db) return Response.json({ status: "configuration_error", detail: "DATABASE_URL is required" }, { status: 503 });
  const date = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const result = await runDailyPipeline(db, [curatedAdapter, openRouterAdapter], date);
  return Response.json(result, { status: result.status === "failed" ? 500 : 200 });
}
