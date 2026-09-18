import { createHash, randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "@/db/schema";
import { normalize } from "@/lib/ranking";
import type { SourceAdapter, ExternalRecord } from "../adapters/types";

type Db = NeonDatabase<typeof schema>;
type RawObservation = typeof schema.rawObservations.$inferSelect;
type FailurePoint = "before-publish";
const methodVersion = "v1";
const anchors = { gpqa: [30, 90] as const, swe_bench: [20, 85] as const, aime: [30, 100] as const };
const boardDefinitions = ["overall", "coding", "price"] as const;
type BoardSlug = (typeof boardDefinitions)[number];

async function sourceFor(db: Db, adapter: SourceAdapter) {
  const existing = await db.select().from(schema.sources).where(eq(schema.sources.slug, adapter.id));
  if (existing[0]) return existing[0];
  return (await db.insert(schema.sources).values({ slug: adapter.id, name: adapter.name, tier: adapter.tier, homepageUrl: adapter.homepageUrl }).returning())[0];
}
async function identityForCurated(db: Db, record: Extract<ExternalRecord, { kind: "model_meta" }>) {
  const providerSlug = record.provider.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  let provider = (await db.select().from(schema.providers).where(eq(schema.providers.slug, providerSlug)))[0];
  if (!provider) provider = (await db.insert(schema.providers).values({ slug: providerSlug, name: record.provider }).returning())[0];
  let model = (await db.select().from(schema.models).where(eq(schema.models.slug, record.modelSlug)))[0];
  if (!model) model = (await db.insert(schema.models).values({ providerId: provider.id, slug: record.modelSlug, name: record.name }).returning())[0];
  let version = (await db.select().from(schema.modelVersions).where(and(eq(schema.modelVersions.modelId, model.id), eq(schema.modelVersions.version, record.version))))[0];
  if (!version) version = (await db.insert(schema.modelVersions).values({ modelId: model.id, version: record.version, contextLength: String(record.contextLength), isCurrent: true }).returning())[0];
  return version;
}
async function aliasFor(db: Db, sourceKey: string, externalId: string) { return (await db.select().from(schema.modelAliases).where(and(eq(schema.modelAliases.sourceKey, sourceKey), eq(schema.modelAliases.externalId, externalId))))[0]; }

export type PipelineResult = { runId: string; status: "published" | "already_published" | "failed"; errors: string[]; snapshotIds: Record<string, string> };
export async function runDailyPipeline(db: Db, adapters: SourceAdapter[], date: string, options: { failAt?: FailurePoint } = {}): Promise<PipelineResult> {
  const existing = (await db.select().from(schema.pipelineRuns).where(eq(schema.pipelineRuns.runDate, date)))[0];
  if (existing?.status === "published") {
    const snapshots = await db.select().from(schema.rankingSnapshots).where(eq(schema.rankingSnapshots.pipelineRunId, existing.id));
    return { runId: existing.id, status: "already_published", errors: existing.errors as string[], snapshotIds: Object.fromEntries(snapshots.map((snapshot) => [snapshot.boardSlug, snapshot.id])) };
  }
  const errors: string[] = [];
  const runId = existing?.id ?? randomUUID();
  if (existing) {
    const priorSnapshots = await db.select().from(schema.rankingSnapshots).where(eq(schema.rankingSnapshots.pipelineRunId, runId));
    if (priorSnapshots.length) await db.delete(schema.rankingEntries).where(inArray(schema.rankingEntries.snapshotId, priorSnapshots.map((snapshot) => snapshot.id)));
    await db.delete(schema.rankingSnapshots).where(eq(schema.rankingSnapshots.pipelineRunId, runId));
    await db.delete(schema.normalizedMetricValues).where(eq(schema.normalizedMetricValues.pipelineRunId, runId));
    await db.delete(schema.boardScores).where(eq(schema.boardScores.pipelineRunId, runId));
    await db.delete(schema.rawObservations).where(eq(schema.rawObservations.pipelineRunId, runId));
    await db.delete(schema.sourceFetches).where(eq(schema.sourceFetches.pipelineRunId, runId));
    await db.update(schema.pipelineRuns).set({ status: "running", errors: [], inputHash: null, completedAt: null }).where(eq(schema.pipelineRuns.id, runId));
  } else {
    await db.insert(schema.pipelineRuns).values({ id: runId, runDate: date, status: "running" });
  }
  try {
    const records: Array<{ adapter: SourceAdapter; record: ExternalRecord; fetchId: string }> = [];
    for (const adapter of adapters) {
      const source = await sourceFor(db, adapter);
      try {
        const result = await adapter.fetch();
        const fetch = (await db.insert(schema.sourceFetches).values({ pipelineRunId: runId, sourceId: source.id, fingerprint: result.fingerprint, payload: result.payload, status: "succeeded" }).returning())[0];
        records.push(...result.records.map((record) => ({ adapter, record, fetchId: fetch.id })));
      } catch (error) {
        const message = `${adapter.id}: ${error instanceof Error ? error.message : "unknown fetch error"}`; errors.push(message);
        await db.insert(schema.sourceFetches).values({ pipelineRunId: runId, sourceId: source.id, payload: { error: message }, status: "failed" });
      }
    }
    const identity = new Map<string, string>();
    for (const item of records.filter((item) => item.record.kind === "model_meta")) {
      const record = item.record as Extract<ExternalRecord, { kind: "model_meta" }>;
      let alias = await aliasFor(db, item.adapter.id, record.externalId);
      if (!alias && item.adapter.id === "curated") {
        const version = await identityForCurated(db, record);
        alias = (await db.insert(schema.modelAliases).values({ sourceKey: item.adapter.id, externalId: record.externalId, modelVersionId: version.id }).returning())[0];
      }
      if (!alias) {
        await db.insert(schema.unmappedEntities).values({ sourceKey: item.adapter.id, externalId: record.externalId, payload: record, firstSeenRunId: runId }).onConflictDoNothing();
        continue;
      }
      identity.set(`${item.adapter.id}:${record.externalId}`, alias.modelVersionId);
    }
    for (const item of records.filter((item) => item.record.kind === "metric")) {
      const record = item.record as Extract<ExternalRecord, { kind: "metric" }>;
      const modelVersionId = identity.get(`${item.adapter.id}:${record.externalId}`) ?? (await aliasFor(db, item.adapter.id, record.externalId))?.modelVersionId;
      if (!modelVersionId) continue;
      await db.insert(schema.rawObservations).values({ pipelineRunId: runId, modelVersionId, metricKey: record.metricKey, value: String(record.value), sourceUrl: record.sourceUrl, observedAt: record.observedAt, sourceFetchId: item.fetchId });
    }
    const raw = await db.select().from(schema.rawObservations).where(eq(schema.rawObservations.pipelineRunId, runId));
    const byModel = new Map<string, Map<string, RawObservation>>();
    for (const observation of raw) { const values = byModel.get(observation.modelVersionId) ?? new Map<string, RawObservation>(); values.set(observation.metricKey, observation); byModel.set(observation.modelVersionId, values); }
    const derived: Array<{ modelVersionId: string; board: BoardSlug; value: number; coverage: number; breakdown: Record<string, unknown> }> = [];
    for (const [modelVersionId, values] of byModel) {
      const normalized: Record<string, number> = {};
      for (const key of Object.keys(anchors) as Array<keyof typeof anchors>) {
        const observation = values.get(key); if (!observation) continue;
        const value = normalize(Number(observation.value), anchors[key]); normalized[key] = value;
        await db.insert(schema.normalizedMetricValues).values({ pipelineRunId: runId, modelVersionId, metricKey: key, normalizedValue: String(value), methodVersion, rawObservationId: observation.id });
      }
      const complete = ["gpqa", "swe_bench", "aime"].filter((key) => normalized[key] !== undefined);
      if (complete.length / 3 >= 0.6) {
        const availableWeights = Object.fromEntries(complete.map((key) => [key, ({ gpqa: 0.4, swe_bench: 0.4, aime: 0.2 } as Record<string, number>)[key]]));
        const totalWeight = Object.values(availableWeights).reduce((sum, weight) => sum + weight, 0);
        const overall = complete.reduce((sum, key) => sum + normalized[key] * availableWeights[key] / totalWeight, 0);
        const breakdown = Object.fromEntries(complete.map((key) => {
          const observation = values.get(key)!;
          return [key, { rawObservationId: observation.id, raw: Number(observation.value), normalized: normalized[key], weight: availableWeights[key] / totalWeight, sourceUrl: observation.sourceUrl, observedAt: observation.observedAt }];
        }));
        derived.push({ modelVersionId, board: "overall", value: overall, coverage: complete.length / 3, breakdown });
      }
      const codingObservation = values.get("swe_bench");
      if (normalized.swe_bench !== undefined && codingObservation) derived.push({ modelVersionId, board: "coding", value: normalized.swe_bench, coverage: 1, breakdown: { swe_bench: { rawObservationId: codingObservation.id, raw: Number(codingObservation.value), normalized: normalized.swe_bench, weight: 1, sourceUrl: codingObservation.sourceUrl, observedAt: codingObservation.observedAt } } });
      const inputPrice = values.get("input_price"); const outputPrice = values.get("output_price");
      if (inputPrice && outputPrice) { const price = Number(inputPrice.value) * 0.75 + Number(outputPrice.value) * 0.25; derived.push({ modelVersionId, board: "price", value: price, coverage: 1, breakdown: { blended_price: { inputRawObservationId: inputPrice.id, outputRawObservationId: outputPrice.id, raw: price, sourceUrl: inputPrice.sourceUrl, observedAt: inputPrice.observedAt } } }); }
    }
    for (const score of derived) await db.insert(schema.boardScores).values({ pipelineRunId: runId, modelVersionId: score.modelVersionId, boardSlug: score.board, score: String(score.value), coverage: String(score.coverage), methodVersion, breakdown: score.breakdown });
    const inputHash = createHash("sha256").update(JSON.stringify(raw.map((row) => [row.modelVersionId, row.metricKey, row.value]).sort())).digest("hex").slice(0, 16);
    await db.update(schema.pipelineRuns).set({ inputHash, status: errors.length ? "degraded" : "running", errors }).where(eq(schema.pipelineRuns.id, runId));
    const snapshotIds: Record<string, string> = {};
    await db.transaction(async (tx: Db) => {
      const previousPointers = await tx.select().from(schema.publishedPointers);
      for (const board of boardDefinitions) {
        const scores = derived.filter((score) => score.board === board).sort((left, right) => board === "price" ? left.value - right.value : right.value - left.value);
        if (scores.length < 3) throw new Error(`${board} did not meet the minimum three ranked models`);
        const snapshot = (await tx.insert(schema.rankingSnapshots).values({ pipelineRunId: runId, boardSlug: board, snapshotDate: date, methodVersion, inputHash, status: "staged" }).returning())[0]; snapshotIds[board] = snapshot.id;
        const pointer = previousPointers.find((item) => item.boardSlug === board);
        const priorEntries = pointer ? await tx.select().from(schema.rankingEntries).where(eq(schema.rankingEntries.snapshotId, pointer.snapshotId)) : [];
        const priorRanks = new Map(priorEntries.map((entry) => [entry.modelVersionId, Number(entry.rank)]));
        await tx.insert(schema.rankingEntries).values(scores.map((score, index) => ({ snapshotId: snapshot.id, modelVersionId: score.modelVersionId, rank: String(index + 1), value: String(score.value), previousRank: priorRanks.has(score.modelVersionId) ? String(priorRanks.get(score.modelVersionId)) : null, isNew: !priorRanks.has(score.modelVersionId) })));
        await tx.update(schema.rankingSnapshots).set({ status: "validated" }).where(eq(schema.rankingSnapshots.id, snapshot.id));
      }
      if (options.failAt === "before-publish") throw new Error("injected failure before publish");
      for (const board of boardDefinitions) {
        const prior = previousPointers.find((item) => item.boardSlug === board);
        if (prior) await tx.update(schema.rankingSnapshots).set({ status: "superseded" }).where(eq(schema.rankingSnapshots.id, prior.snapshotId));
        await tx.insert(schema.publishedPointers).values({ boardSlug: board, snapshotId: snapshotIds[board] }).onConflictDoUpdate({ target: schema.publishedPointers.boardSlug, set: { snapshotId: snapshotIds[board], updatedAt: new Date() } });
        await tx.update(schema.rankingSnapshots).set({ status: "published" }).where(eq(schema.rankingSnapshots.id, snapshotIds[board]));
      }
    });
    await db.update(schema.pipelineRuns).set({ status: "published", completedAt: new Date() }).where(eq(schema.pipelineRuns.id, runId));
    return { runId, status: "published", errors, snapshotIds };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown pipeline error"; errors.push(message);
    await db.update(schema.pipelineRuns).set({ status: "failed", errors, completedAt: new Date() }).where(eq(schema.pipelineRuns.id, runId));
    return { runId, status: "failed", errors, snapshotIds: {} };
  }
}

export async function rollbackBoard(db: Db, boardSlug: BoardSlug, snapshotId: string) {
  const snapshot = (await db.select().from(schema.rankingSnapshots).where(and(eq(schema.rankingSnapshots.id, snapshotId), eq(schema.rankingSnapshots.boardSlug, boardSlug))))[0];
  if (!snapshot) throw new Error("Snapshot does not belong to the requested board");
  await db.transaction(async (tx: Db) => { await tx.insert(schema.publishedPointers).values({ boardSlug, snapshotId }).onConflictDoUpdate({ target: schema.publishedPointers.boardSlug, set: { snapshotId, updatedAt: new Date() } }); await tx.update(schema.rankingSnapshots).set({ status: "published" }).where(eq(schema.rankingSnapshots.id, snapshotId)); });
}
