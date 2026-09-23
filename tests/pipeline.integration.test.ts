import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import { describe, expect, it } from "vitest";
import * as schema from "../src/db/schema";
import { curatedAdapter } from "../src/ingest/adapters/curated";
import type { SourceAdapter } from "../src/ingest/adapters/types";
import { rollbackBoard, runDailyPipeline } from "../src/ingest/pipeline/runner";
import { loadPublicSnapshotFromDb } from "../src/lib/public-data";

async function testDb() {
  const client = new PGlite();
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: "drizzle" });
  return { client, db: db as unknown as NeonDatabase<typeof schema> };
}

const fixtureAdapter: SourceAdapter = {
  ...curatedAdapter,
  id: "fixture",
  name: "Deterministic test fixture",
  adapterVersion: "2.0.0-test",
  async fetch() {
    const base = await curatedAdapter.fetch();
    const modelIds = base.records.filter((record) => record.kind === "model_meta").map((record) => record.externalId);
    const extra = modelIds.flatMap((externalId, index) => [
      { kind: "metric" as const, externalId, metricKey: "cost_per_task", benchmarkName: "Fixture cost", unit: "USD / task", value: 0.5 + index / 10, sourceUrl: "https://example.com/cost", observedAt: "2026-09-17" },
      { kind: "metric" as const, externalId, metricKey: "output_speed", benchmarkName: "Fixture speed", unit: "tokens / second", value: 50 + index * 10, sourceUrl: "https://example.com/speed", observedAt: "2026-09-17" },
      { kind: "metric" as const, externalId, metricKey: "gdpval", benchmarkName: "Fixture agentic", unit: "%", value: 50 + index, sourceUrl: "https://example.com/agentic", observedAt: "2026-09-17" },
      { kind: "metric" as const, externalId, metricKey: "long_context", benchmarkName: "Fixture context", unit: "%", value: 60 + index, sourceUrl: "https://example.com/context", observedAt: "2026-09-17" },
      { kind: "metric" as const, externalId, metricKey: "korean", benchmarkName: "Fixture Korean", unit: "%", value: 55 + index, sourceUrl: "https://example.com/korean", observedAt: "2026-09-17" },
    ]);
    return { ...base, records: [...base.records, ...extra], payload: [...base.records, ...extra] };
  },
};

describe("durable daily pipeline", () => {
  it("persists all four data layers and is idempotent", async () => {
    const { client, db } = await testDb();
    const first = await runDailyPipeline(db, [fixtureAdapter], "2026-09-17");
    expect(first.status).toBe("published");
    expect(Object.keys(first.snapshotIds)).toHaveLength(6);
    expect(await db.select().from(schema.rawObservations)).toHaveLength(100);
    expect(await db.select().from(schema.normalizedMetricValues)).toHaveLength(70);
    expect(await db.select().from(schema.boardScores)).toHaveLength(60);
    expect(await db.select().from(schema.rankingEntries)).toHaveLength(60);
    const pointers = await db.select().from(schema.publishedPointers);
    expect(pointers).toHaveLength(6);
    const publicSnapshot = await loadPublicSnapshotFromDb(db);
    expect(publicSnapshot?.date).toBe("2026-09-17");
    expect(publicSnapshot?.boards.overall.entries).toHaveLength(10);
    expect(publicSnapshot?.boards.overall.entries[0]?.components["GPQA Diamond"]?.source.url).toMatch(/^https:\/\//);
    const second = await runDailyPipeline(db, [fixtureAdapter], "2026-09-17");
    expect(second.status).toBe("already_published");
    expect(await db.select().from(schema.rankingSnapshots)).toHaveLength(6);
    await client.close();
  });

  it("keeps the last published pointer when a staged run fails and supports rollback", async () => {
    const { client, db } = await testDb();
    const baseline = await runDailyPipeline(db, [fixtureAdapter], "2026-09-17");
    const before = await db.select().from(schema.publishedPointers);
    const failed = await runDailyPipeline(db, [fixtureAdapter], "2026-09-18", { failAt: "before-publish" });
    expect(failed.status).toBe("failed");
    expect(await db.select().from(schema.publishedPointers)).toEqual(before);
    const next = await runDailyPipeline(db, [fixtureAdapter], "2026-09-18");
    expect(next.status).toBe("published");
    await rollbackBoard(db, "overall", baseline.snapshotIds.overall);
    const overall = (await db.select().from(schema.publishedPointers)).find((pointer) => pointer.boardSlug === "overall");
    expect(overall?.snapshotId).toBe(baseline.snapshotIds.overall);
    await client.close();
  });

  it("publishes a method upgrade without deleting the same-day legacy snapshot", async () => {
    const { client, db } = await testDb();
    const legacyRunId = "00000000-0000-4000-8000-000000000001";
    const legacySnapshotId = "00000000-0000-4000-8000-000000000002";
    await db.insert(schema.pipelineRuns).values({ id: legacyRunId, runDate: "2026-09-17", status: "published" });
    await db.insert(schema.rankingSnapshots).values({ id: legacySnapshotId, pipelineRunId: legacyRunId, boardSlug: "overall", snapshotDate: "2026-09-17", methodVersion: "v1", inputHash: "legacy", status: "published" });
    await db.insert(schema.publishedPointers).values({ boardSlug: "overall", snapshotId: legacySnapshotId });

    const upgraded = await runDailyPipeline(db, [fixtureAdapter], "2026-09-17");
    expect(upgraded.status).toBe("published");
    expect(upgraded.runId).not.toBe(legacyRunId);
    const runs = await db.select().from(schema.pipelineRuns);
    expect(runs.map((run) => run.runDate)).toContain("2026-09-17@v2.1");
    const legacy = (await db.select().from(schema.rankingSnapshots)).find((snapshot) => snapshot.id === legacySnapshotId);
    expect(legacy?.status).toBe("superseded");
    expect(await db.select().from(schema.rankingSnapshots)).toHaveLength(7);
    await client.close();
  });

  it("retires an obsolete legacy board pointer during an idempotent rerun", async () => {
    const { client, db } = await testDb();
    const first = await runDailyPipeline(db, [fixtureAdapter], "2026-09-17");
    const legacySnapshotId = "00000000-0000-4000-8000-000000000003";
    await db.insert(schema.rankingSnapshots).values({ id: legacySnapshotId, pipelineRunId: first.runId, boardSlug: "cheapest", snapshotDate: "2026-09-17", methodVersion: "v1", inputHash: "legacy", status: "published" });
    await db.insert(schema.publishedPointers).values({ boardSlug: "cheapest", snapshotId: legacySnapshotId });

    expect((await runDailyPipeline(db, [fixtureAdapter], "2026-09-17")).status).toBe("already_published");
    expect(await db.select().from(schema.publishedPointers)).toHaveLength(6);
    const legacy = (await db.select().from(schema.rankingSnapshots)).find((snapshot) => snapshot.id === legacySnapshotId);
    expect(legacy?.status).toBe("superseded");
    await client.close();
  });
});
