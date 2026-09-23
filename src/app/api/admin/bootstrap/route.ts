import path from "node:path";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { getDb } from "@/db/client";
import { artificialAnalysisAdapter } from "@/ingest/adapters/artificial-analysis";
import { openRouterAdapter } from "@/ingest/adapters/openrouter";
import { runDailyPipeline } from "@/ingest/pipeline/runner";
import { syncPublishedModelGuides } from "@/lib/model-guide-store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) return Response.json({ status: "configuration_error", detail: "ADMIN_TOKEN is required" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${adminToken}`) return new Response("Unauthorized", { status: 401 });

  const db = getDb();
  if (!db) return Response.json({ status: "configuration_error", detail: "DATABASE_URL is required" }, { status: 503 });

  try {
    await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
    const date = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
    const result = await runDailyPipeline(db, [artificialAnalysisAdapter, openRouterAdapter], date);
    const guidesSynced = result.status === "failed" ? 0 : await syncPublishedModelGuides(db);
    return Response.json({ migrated: true, guidesSynced, ...result }, { status: result.status === "failed" ? 500 : 200 });
  } catch (error) {
    return Response.json({
      status: "failed",
      detail: error instanceof Error ? error.message : "Unknown bootstrap error",
    }, { status: 500 });
  }
}
