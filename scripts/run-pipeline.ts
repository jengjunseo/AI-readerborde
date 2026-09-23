import { createNeonDb } from "../src/db/client";
import { artificialAnalysisAdapter } from "../src/ingest/adapters/artificial-analysis";
import { openRouterAdapter } from "../src/ingest/adapters/openrouter";
import { runDailyPipeline } from "../src/ingest/pipeline/runner";
import { syncPublishedModelGuides } from "../src/lib/model-guide-store";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for durable pipeline execution");
const date = process.argv[2] ?? new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
const db = createNeonDb(databaseUrl);
const result = await runDailyPipeline(db, [artificialAnalysisAdapter, openRouterAdapter], date);
const guidesSynced = result.status === "failed" ? 0 : await syncPublishedModelGuides(db);
console.log(JSON.stringify({ ...result, guidesSynced }, null, 2));
if (result.status === "failed") process.exitCode = 1;
