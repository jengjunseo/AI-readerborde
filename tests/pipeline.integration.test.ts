import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import { describe, expect, it } from "vitest";
import * as schema from "../src/db/schema";
import { curatedAdapter } from "../src/ingest/adapters/curated";
import { rollbackBoard, runDailyPipeline } from "../src/ingest/pipeline/runner";

async function testDb() {
  const client = new PGlite();
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: "drizzle" });
  return { client, db: db as unknown as NeonDatabase<typeof schema> };
}

describe("durable daily pipeline", () => {
  it("persists all four data layers and is idempotent", async () => {
    const { client, db } = await testDb();
    const first = await runDailyPipeline(db, [curatedAdapter], "2026-09-17");
    expect(first.status).toBe("published");
    expect(Object.keys(first.snapshotIds)).toHaveLength(3);
    expect(await db.select().from(schema.rawObservations)).toHaveLength(50);
    expect(await db.select().from(schema.normalizedMetricValues)).toHaveLength(30);
    expect(await db.select().from(schema.boardScores)).toHaveLength(30);
    expect(await db.select().from(schema.rankingEntries)).toHaveLength(30);
    const pointers = await db.select().from(schema.publishedPointers);
    expect(pointers).toHaveLength(3);
    const second = await runDailyPipeline(db, [curatedAdapter], "2026-09-17");
    expect(second.status).toBe("already_published");
    expect(await db.select().from(schema.rankingSnapshots)).toHaveLength(3);
    await client.close();
  });

  it("keeps the last published pointer when a staged run fails and supports rollback", async () => {
    const { client, db } = await testDb();
    const baseline = await runDailyPipeline(db, [curatedAdapter], "2026-09-17");
    const before = await db.select().from(schema.publishedPointers);
    const failed = await runDailyPipeline(db, [curatedAdapter], "2026-09-18", { failAt: "before-publish" });
    expect(failed.status).toBe("failed");
    expect(await db.select().from(schema.publishedPointers)).toEqual(before);
    const next = await runDailyPipeline(db, [curatedAdapter], "2026-09-18");
    expect(next.status).toBe("published");
    await rollbackBoard(db, "overall", baseline.snapshotIds.overall);
    const overall = (await db.select().from(schema.publishedPointers)).find((pointer) => pointer.boardSlug === "overall");
    expect(overall?.snapshotId).toBe(baseline.snapshotIds.overall);
    await client.close();
  });
});
