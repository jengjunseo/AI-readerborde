import path from "node:path";
import { spawnSync } from "node:child_process";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { createNeonDb } from "../src/db/client";
import { artificialAnalysisAdapter } from "../src/ingest/adapters/artificial-analysis";
import { openRouterAdapter } from "../src/ingest/adapters/openrouter";
import { runDailyPipeline } from "../src/ingest/pipeline/runner";

async function main() {
  const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const build = spawnSync(process.execPath, [nextBin, "build"], { stdio: "inherit", env: process.env });
  if (build.status !== 0) process.exit(build.status ?? 1);

  if (process.env.VERCEL_ENV === "production") {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL is required for a production deployment");
    const db = createNeonDb(databaseUrl);
    await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
    const date = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
    const result = await runDailyPipeline(db, [artificialAnalysisAdapter, openRouterAdapter], date);
    console.log(JSON.stringify({ productionPipeline: result.status, runId: result.runId, errors: result.errors }));
    if (result.status === "failed") process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
