import { createHash, randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "@/db/schema";
import { normalize } from "@/lib/ranking";
import type { BoardSlug } from "@/lib/types";
import type { ExternalRecord, SourceAdapter } from "../adapters/types";

type Db = NeonDatabase<typeof schema>;
type RawObservation = typeof schema.rawObservations.$inferSelect;
type FailurePoint = "before-publish";
const methodVersion = "v2.0";
export const boardDefinitions: BoardSlug[] = ["overall", "coding", "agentic", "value", "speed", "korean"];

const metricAnchors: Record<string, readonly [number, number]> = {
  gpqa: [0, 100], hle: [0, 100], terminal_bench: [0, 100], scicode: [0, 100], swe_bench: [0, 100],
  gdpval: [0, 100], analyst_agent: [0, 100], apex_agents: [0, 100], itbench_sre: [0, 100],
  long_context: [0, 100], multimodal: [0, 100], korean: [0, 100], output_speed: [20, 400],
};
const axisDefinitions = {
  reasoning: { weight: 0.25, metrics: ["gpqa", "hle"] },
  coding: { weight: 0.25, metrics: ["terminal_bench", "scicode", "swe_bench"] },
  agentic: { weight: 0.15, metrics: ["gdpval", "analyst_agent", "apex_agents", "itbench_sre"] },
  context: { weight: 0.10, metrics: ["long_context", "multimodal"] },
  korean: { weight: 0.10, metrics: ["korean"] },
  value: { weight: 0.10, metrics: ["cost_per_task"] },
  speed: { weight: 0.05, metrics: ["output_speed"] },
} as const;

async function sourceFor(db: Db, adapter: SourceAdapter) {
  const existing = await db.select().from(schema.sources).where(eq(schema.sources.slug, adapter.id));
  if (existing[0]) return existing[0];
  return (await db.insert(schema.sources).values({ slug: adapter.id, name: adapter.name, tier: adapter.tier, homepageUrl: adapter.homepageUrl, termsUrl: adapter.termsUrl }).returning())[0];
}

async function identityForTrusted(db: Db, record: Extract<ExternalRecord, { kind: "model_meta" }>) {
  const providerSlug = record.provider.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  let provider = (await db.select().from(schema.providers).where(eq(schema.providers.slug, providerSlug)))[0];
  if (!provider) provider = (await db.insert(schema.providers).values({ slug: providerSlug, name: record.provider }).returning())[0];
  let model = (await db.select().from(schema.models).where(eq(schema.models.slug, record.modelSlug)))[0];
  if (!model) model = (await db.insert(schema.models).values({ providerId: provider.id, slug: record.modelSlug, name: record.name, releaseDate: record.releaseDate, lifecycle: "candidate" }).returning())[0];
  else await db.update(schema.models).set({ name: record.name, providerId: provider.id, releaseDate: record.releaseDate ?? model.releaseDate }).where(eq(schema.models.id, model.id));
  let version = (await db.select().from(schema.modelVersions).where(and(eq(schema.modelVersions.modelId, model.id), eq(schema.modelVersions.version, record.version))))[0];
  if (!version) {
    await db.update(schema.modelVersions).set({ isCurrent: false }).where(eq(schema.modelVersions.modelId, model.id));
    version = (await db.insert(schema.modelVersions).values({ modelId: model.id, version: record.version, contextLength: String(record.contextLength), isCurrent: true }).returning())[0];
  } else if (Number(version.contextLength) !== record.contextLength) {
    await db.update(schema.modelVersions).set({ contextLength: String(record.contextLength), isCurrent: true }).where(eq(schema.modelVersions.id, version.id));
  }
  return version;
}

async function aliasFor(db: Db, sourceKey: string, externalId: string) {
  return (await db.select().from(schema.modelAliases).where(and(eq(schema.modelAliases.sourceKey, sourceKey), eq(schema.modelAliases.externalId, externalId))))[0];
}

function normalizedValue(metricKey: string, raw: number) {
  if (metricKey === "cost_per_task") return Math.max(0, Math.min(100, 100 - normalize(raw, [0, 8])));
  const anchor = metricAnchors[metricKey];
  return anchor ? normalize(raw, anchor) : undefined;
}

function leaf(observation: RawObservation, normalized: number, weight: number) {
  return { rawObservationId: observation.id, raw: Number(observation.value), normalized, weight, sourceUrl: observation.sourceUrl, observedAt: observation.observedAt, benchmarkName: observation.benchmarkName, benchmarkVersion: observation.benchmarkVersion, unit: observation.unit };
}

export type PipelineResult = { runId: string; status: "published" | "already_published" | "failed"; errors: string[]; snapshotIds: Record<string, string> };

export async function runDailyPipeline(db: Db, adapters: SourceAdapter[], date: string, options: { failAt?: FailurePoint } = {}): Promise<PipelineResult> {
  const versionedRunDate = `${date}@${methodVersion}`;
  const runCandidates = await db.select().from(schema.pipelineRuns).where(inArray(schema.pipelineRuns.runDate, [date, versionedRunDate]));
  let existing = runCandidates.find((run) => run.runDate === versionedRunDate) ?? runCandidates.find((run) => run.runDate === date);
  if (existing && (existing.status === "published" || existing.status === "degraded")) {
    const snapshots = await db.select().from(schema.rankingSnapshots).where(eq(schema.rankingSnapshots.pipelineRunId, existing.id));
    const isCurrentCompleteSet = boardDefinitions.every((board) => snapshots.some((snapshot) => snapshot.boardSlug === board && snapshot.status === "published" && snapshot.methodVersion === methodVersion));
    if (isCurrentCompleteSet) return { runId: existing.id, status: "already_published", errors: existing.errors as string[], snapshotIds: Object.fromEntries(snapshots.map((snapshot) => [snapshot.boardSlug, snapshot.id])) };
    // Preserve an already-published legacy run and its rollback-safe snapshots.
    // A method upgrade for the same calendar date gets a versioned idempotency key.
    existing = undefined;
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
    await db.update(schema.pipelineRuns).set({ status: "running", errors: [], inputHash: null, completedAt: null, discoveredModels: 0, publishedModels: 0, sourceSuccessCount: 0, sourceFailureCount: 0, coverage: "0" }).where(eq(schema.pipelineRuns.id, runId));
  } else await db.insert(schema.pipelineRuns).values({ id: runId, runDate: runCandidates.some((run) => run.runDate === date) ? versionedRunDate : date, status: "running", commitSha: process.env.VERCEL_GIT_COMMIT_SHA });
  try {
    const records: Array<{ adapter: SourceAdapter; record: ExternalRecord; fetchId: string; payloadHash: string }> = [];
    let sourceSuccessCount = 0;
    for (const adapter of adapters) {
      const source = await sourceFor(db, adapter);
      try {
        const result = await adapter.fetch();
        const fetch = (await db.insert(schema.sourceFetches).values({ pipelineRunId: runId, sourceId: source.id, fingerprint: result.fingerprint, payload: result.payload, status: "succeeded" }).returning())[0];
        records.push(...result.records.map((record) => ({ adapter, record, fetchId: fetch.id, payloadHash: result.fingerprint })));
        sourceSuccessCount += 1;
      } catch (error) {
        const message = `${adapter.id}: ${error instanceof Error ? error.message : "unknown fetch error"}`;
        errors.push(message);
        await db.insert(schema.sourceFetches).values({ pipelineRunId: runId, sourceId: source.id, payload: { error: message }, status: "failed" });
      }
    }
    if (!records.some((item) => item.adapter.canCreateIdentity)) throw new Error("No trusted evaluation source succeeded");
    const identity = new Map<string, string>();
    for (const item of records.filter((item) => item.record.kind === "model_meta")) {
      const record = item.record as Extract<ExternalRecord, { kind: "model_meta" }>;
      let alias = await aliasFor(db, item.adapter.id, record.externalId);
      if (!alias && item.adapter.canCreateIdentity) {
        const version = await identityForTrusted(db, record);
        alias = (await db.insert(schema.modelAliases).values({ sourceKey: item.adapter.id, externalId: record.externalId, modelVersionId: version.id }).onConflictDoNothing().returning())[0] ?? await aliasFor(db, item.adapter.id, record.externalId);
      }
      if (!alias && !item.adapter.canCreateIdentity) {
        const canonical = (await db.select({ id: schema.modelVersions.id }).from(schema.modelVersions).innerJoin(schema.models, eq(schema.modelVersions.modelId, schema.models.id)).where(and(eq(schema.models.slug, record.modelSlug), eq(schema.modelVersions.isCurrent, true))))[0];
        if (canonical) alias = (await db.insert(schema.modelAliases).values({ sourceKey: item.adapter.id, externalId: record.externalId, modelVersionId: canonical.id }).onConflictDoNothing().returning())[0] ?? await aliasFor(db, item.adapter.id, record.externalId);
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
      await db.insert(schema.rawObservations).values({ pipelineRunId: runId, modelVersionId, metricKey: record.metricKey, benchmarkName: record.benchmarkName, benchmarkVersion: record.benchmarkVersion, externalModelId: record.externalId, value: String(record.value), unit: record.unit, sourceUrl: record.sourceUrl, observedAt: record.observedAt, adapterVersion: item.adapter.adapterVersion, rawPayloadHash: item.payloadHash, licenseTermsNote: record.licenseTermsNote, sourceFetchId: item.fetchId });
    }
    const raw = await db.select().from(schema.rawObservations).where(eq(schema.rawObservations.pipelineRunId, runId));
    const byModel = new Map<string, Map<string, RawObservation>>();
    for (const observation of raw) { const values = byModel.get(observation.modelVersionId) ?? new Map<string, RawObservation>(); values.set(observation.metricKey, observation); byModel.set(observation.modelVersionId, values); }
    const derived: Array<{ modelVersionId: string; board: BoardSlug; value: number; coverage: number; breakdown: Record<string, unknown> }> = [];
    const modelCoverages: number[] = [];
    for (const [modelVersionId, values] of byModel) {
      const normalized: Record<string, number> = {};
      for (const [key, observation] of values) {
        const value = normalizedValue(key, Number(observation.value));
        if (value === undefined) continue;
        normalized[key] = value;
        await db.insert(schema.normalizedMetricValues).values({ pipelineRunId: runId, modelVersionId, metricKey: key, normalizedValue: String(value), methodVersion, rawObservationId: observation.id });
      }
      const axes: Record<string, { score: number; weight: number; keys: string[] }> = {};
      for (const [axis, definition] of Object.entries(axisDefinitions)) {
        const keys = definition.metrics.filter((key) => normalized[key] !== undefined);
        if (keys.length) axes[axis] = { score: keys.reduce((sum, key) => sum + normalized[key], 0) / keys.length, weight: definition.weight, keys };
      }
      const availableWeight = Object.values(axes).reduce((sum, axis) => sum + axis.weight, 0);
      const capabilityAxes = ["reasoning", "coding", "agentic", "context", "korean"].filter((axis) => axes[axis]);
      if (availableWeight >= 0.5 && capabilityAxes.length >= 2) {
        const breakdown: Record<string, unknown> = {};
        for (const [axisName, axis] of Object.entries(axes)) {
          for (const key of axis.keys) breakdown[key] = leaf(values.get(key)!, normalized[key], (axis.weight / availableWeight) / axis.keys.length);
          breakdown[`axis:${axisName}`] = { normalized: axis.score, weight: axis.weight / availableWeight };
        }
        const score = Object.values(axes).reduce((sum, axis) => sum + axis.score * axis.weight, 0) / availableWeight;
        derived.push({ modelVersionId, board: "overall", value: score, coverage: availableWeight, breakdown });
        modelCoverages.push(availableWeight);
      }
      const pushAxis = (board: BoardSlug, axisName: keyof typeof axisDefinitions) => {
        const axis = axes[axisName]; if (!axis) return;
        derived.push({ modelVersionId, board, value: axis.score, coverage: axis.keys.length / axisDefinitions[axisName].metrics.length, breakdown: Object.fromEntries(axis.keys.map((key) => [key, leaf(values.get(key)!, normalized[key], 1 / axis.keys.length)])) });
      };
      pushAxis("coding", "coding"); pushAxis("agentic", "agentic"); pushAxis("value", "value"); pushAxis("speed", "speed"); pushAxis("korean", "korean");
    }
    for (const score of derived) await db.insert(schema.boardScores).values({ pipelineRunId: runId, modelVersionId: score.modelVersionId, boardSlug: score.board, score: String(score.value), coverage: String(score.coverage), methodVersion, breakdown: score.breakdown });
    const inputHash = createHash("sha256").update(JSON.stringify(raw.map((row) => [row.modelVersionId, row.metricKey, row.value, row.rawPayloadHash]).sort())).digest("hex").slice(0, 16);
    const discoveredModels = new Set(records.filter((item) => item.record.kind === "model_meta").map((item) => `${item.adapter.id}:${(item.record as Extract<ExternalRecord, { kind: "model_meta" }>).externalId}`)).size;
    const publishedVersionIds = [...new Set(derived.filter((score) => score.board === "overall").map((score) => score.modelVersionId))];
    if (publishedVersionIds.length) {
      const versions = await db.select({ modelId: schema.modelVersions.modelId }).from(schema.modelVersions).where(inArray(schema.modelVersions.id, publishedVersionIds));
      await db.update(schema.models).set({ lifecycle: "published", verifiedAt: new Date() }).where(inArray(schema.models.id, versions.map((version) => version.modelId)));
    }
    const coverage = modelCoverages.length ? modelCoverages.reduce((sum, value) => sum + value, 0) / modelCoverages.length : 0;
    await db.update(schema.pipelineRuns).set({ inputHash, errors, discoveredModels, publishedModels: publishedVersionIds.length, sourceSuccessCount, sourceFailureCount: errors.length, coverage: String(coverage) }).where(eq(schema.pipelineRuns.id, runId));
    const snapshotIds: Record<string, string> = {};
    await db.transaction(async (tx: Db) => {
      const previousPointers = await tx.select().from(schema.publishedPointers);
      for (const board of boardDefinitions) {
        const scores = derived.filter((score) => score.board === board).sort((left, right) => right.value - left.value);
        if (board !== "korean" && scores.length < 3) throw new Error(`${board} did not meet the minimum three ranked models`);
        const snapshot = (await tx.insert(schema.rankingSnapshots).values({ pipelineRunId: runId, boardSlug: board, snapshotDate: date, methodVersion, inputHash, status: "staged" }).returning())[0];
        snapshotIds[board] = snapshot.id;
        const pointer = previousPointers.find((item) => item.boardSlug === board);
        const priorEntries = pointer ? await tx.select().from(schema.rankingEntries).where(eq(schema.rankingEntries.snapshotId, pointer.snapshotId)) : [];
        const priorRanks = new Map(priorEntries.map((entry) => [entry.modelVersionId, Number(entry.rank)]));
        if (scores.length) await tx.insert(schema.rankingEntries).values(scores.map((score, index) => {
          const rank = index + 1; const previousRank = priorRanks.get(score.modelVersionId);
          const movementReason = previousRank === undefined ? "새로 검증됨" : previousRank > rank ? "상대 순위 상승" : previousRank < rank ? "상대 순위 하락" : "변동 없음";
          return { snapshotId: snapshot.id, modelVersionId: score.modelVersionId, rank: String(rank), value: String(score.value), previousRank: previousRank === undefined ? null : String(previousRank), isNew: previousRank === undefined, movementReason };
        }));
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
    await db.update(schema.pipelineRuns).set({ status: errors.length ? "degraded" : "published", completedAt: new Date() }).where(eq(schema.pipelineRuns.id, runId));
    return { runId, status: "published", errors, snapshotIds };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown pipeline error"; errors.push(message);
    await db.update(schema.pipelineRuns).set({ status: "failed", errors, completedAt: new Date(), sourceFailureCount: errors.length }).where(eq(schema.pipelineRuns.id, runId));
    return { runId, status: "failed", errors, snapshotIds: {} };
  }
}

export async function rollbackBoard(db: Db, boardSlug: BoardSlug, snapshotId: string) {
  const snapshot = (await db.select().from(schema.rankingSnapshots).where(and(eq(schema.rankingSnapshots.id, snapshotId), eq(schema.rankingSnapshots.boardSlug, boardSlug))))[0];
  if (!snapshot) throw new Error("Snapshot does not belong to the requested board");
  await db.transaction(async (tx: Db) => { await tx.insert(schema.publishedPointers).values({ boardSlug, snapshotId }).onConflictDoUpdate({ target: schema.publishedPointers.boardSlug, set: { snapshotId, updatedAt: new Date() } }); await tx.update(schema.rankingSnapshots).set({ status: "published" }).where(eq(schema.rankingSnapshots.id, snapshotId)); });
}
