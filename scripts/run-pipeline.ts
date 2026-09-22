import { createNeonDb } from "../src/db/client";
import { artificialAnalysisAdapter } from "../src/ingest/adapters/artificial-analysis";
import { openRouterAdapter } from "../src/ingest/adapters/openrouter";
import { runDailyPipeline } from "../src/ingest/pipeline/runner";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for durable pipeline execution");
const date = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const result = await runDailyPipeline(createNeonDb(databaseUrl), [artificialAnalysisAdapter, openRouterAdapter], date);
console.log(JSON.stringify(result, null, 2));
if (result.status === "failed") process.exitCode = 1;
