import { unstable_noStore as noStore } from "next/cache";
import { and, desc, eq, lt } from "drizzle-orm";
import { getDb, type AppDb } from "@/db/client";
import { boardScores, models, modelVersions, pipelineRuns, providers, publishedPointers, rankingEntries, rankingSnapshots, rawObservations } from "@/db/schema";
import { latestSnapshot } from "./catalog";
import { curatedModels } from "./curated-data";
import { boardMeta, boardOrder } from "./board-meta";
import type { Board, BoardSlug, Model, RankedEntry, Snapshot, Source } from "./types";

type BreakdownLeaf = { raw?: number; normalized?: number; weight?: number; sourceUrl?: string; observedAt?: string; benchmarkName?: string; benchmarkVersion?: string; unit?: string };
export { boardMeta, boardOrder } from "./board-meta";
const metricLabels: Record<string, string> = {
  gpqa: "GPQA Diamond", hle: "Humanity's Last Exam", terminal_bench: "Terminal-Bench 4.0", scicode: "SciCode", swe_bench: "SWE-bench Verified",
  gdpval: "GDPval-AA", analyst_agent: "AA-Briefcase / Analyst Agent", apex_agents: "APEX Agents", itbench_sre: "ITBench SRE",
  long_context: "AA-LCR", multimodal: "MMMU-Pro", cost_per_task: "Cost per Intelligence Index task", output_speed: "Median output speed", korean: "한국어 평가",
};
const sourceFor = (leaf: BreakdownLeaf): Source => ({ label: leaf.sourceUrl ? new URL(leaf.sourceUrl).hostname.replace(/^www\./, "") : "출처 미상", url: leaf.sourceUrl ?? "#", observedAt: leaf.observedAt ?? "UNKNOWN", tier: "T2" });

const fallbackModel = (slug: string, name: string, provider: string, version: string, context: number, lifecycle?: string): Model => {
  const curated = curatedModels.find((model) => model.slug === slug);
  if (curated) return { ...curated, lifecycle };
  const source: Source = { label: "데이터베이스 관측값", url: "#", observedAt: "UNKNOWN", tier: "T3" };
  return { slug, name, provider, version, context, inputPrice: 0, outputPrice: 0, lifecycle, priceSource: source, metrics: {} };
};

export type PublicHealth = { latestSnapshotAt: string; lastCronSuccessAt?: string; sourceCoverage: number; publishedModels: number; methodVersion: string; stale: boolean };
export type PublicData = { snapshot: Snapshot; source: "database" | "fallback"; health: PublicHealth; notice?: string };

export function localizePublicSnapshot(snapshot: Snapshot): Snapshot {
  const boards = {} as Record<BoardSlug, Board>;
  for (const slug of boardOrder) boards[slug] = { slug, ...boardMeta[slug], entries: snapshot.boards[slug]?.entries ?? [] };
  return { ...snapshot, boards };
}

export async function loadPublicSnapshotFromDb(db: AppDb): Promise<Snapshot | undefined> {
  const snapshots = await db.select({ boardSlug: rankingSnapshots.boardSlug, snapshotDate: rankingSnapshots.snapshotDate, methodVersion: rankingSnapshots.methodVersion, inputHash: rankingSnapshots.inputHash, pipelineRunId: rankingSnapshots.pipelineRunId }).from(publishedPointers).innerJoin(rankingSnapshots, eq(publishedPointers.snapshotId, rankingSnapshots.id));
  const overallSnapshot = snapshots.find((row) => row.boardSlug === "overall");
  if (!overallSnapshot) return undefined;
  const rows = await db.select({ boardSlug: rankingSnapshots.boardSlug, rank: rankingEntries.rank, value: rankingEntries.value, previousRank: rankingEntries.previousRank, isNew: rankingEntries.isNew, movementReason: rankingEntries.movementReason, modelVersionId: modelVersions.id, modelSlug: models.slug, modelName: models.name, lifecycle: models.lifecycle, releaseDate: models.releaseDate, providerName: providers.name, version: modelVersions.version, contextLength: modelVersions.contextLength, coverage: boardScores.coverage, breakdown: boardScores.breakdown }).from(publishedPointers).innerJoin(rankingSnapshots, eq(publishedPointers.snapshotId, rankingSnapshots.id)).innerJoin(rankingEntries, eq(rankingEntries.snapshotId, rankingSnapshots.id)).innerJoin(modelVersions, eq(rankingEntries.modelVersionId, modelVersions.id)).innerJoin(models, eq(modelVersions.modelId, models.id)).innerJoin(providers, eq(models.providerId, providers.id)).innerJoin(boardScores, and(eq(boardScores.pipelineRunId, rankingSnapshots.pipelineRunId), eq(boardScores.modelVersionId, modelVersions.id), eq(boardScores.boardSlug, rankingSnapshots.boardSlug)));
  const raw = await db.select().from(rawObservations).where(eq(rawObservations.pipelineRunId, overallSnapshot.pipelineRunId));
  const rawByModel = new Map<string, Map<string, typeof raw[number]>>();
  for (const observation of raw) { const values = rawByModel.get(observation.modelVersionId) ?? new Map(); values.set(observation.metricKey, observation); rawByModel.set(observation.modelVersionId, values); }
  const previous = await db.select({ date: rankingSnapshots.snapshotDate }).from(rankingSnapshots).where(and(eq(rankingSnapshots.boardSlug, "overall"), lt(rankingSnapshots.snapshotDate, overallSnapshot.snapshotDate))).orderBy(desc(rankingSnapshots.snapshotDate)).limit(1);
  const boards = {} as Record<BoardSlug, Board>;
  for (const slug of boardOrder) {
    const entries: RankedEntry[] = rows.filter((row) => row.boardSlug === slug).map((row) => {
      const breakdown = (row.breakdown ?? {}) as Record<string, BreakdownLeaf>;
      const specs = rawByModel.get(row.modelVersionId) ?? new Map();
      const input = specs.get("input_price"); const output = specs.get("output_price"); const cost = specs.get("cost_per_task"); const speed = specs.get("output_speed"); const latency = specs.get("latency");
      const model = fallbackModel(row.modelSlug, row.modelName, row.providerName, row.version, Number(row.contextLength), row.lifecycle);
      model.releaseDate = row.releaseDate ?? undefined;
      model.inputPrice = Number(input?.value ?? 0); model.outputPrice = Number(output?.value ?? 0);
      if (input) model.priceSource = { label: new URL(input.sourceUrl).hostname.replace(/^www\./, ""), url: input.sourceUrl, observedAt: input.observedAt, tier: "T2" };
      const confidence: RankedEntry["confidence"] = Number(row.coverage) >= .8 ? "높음" : Number(row.coverage) >= .55 ? "보통" : "낮음";
      return { model, rank: Number(row.rank), value: Number(row.value), previousRank: row.previousRank === null ? undefined : Number(row.previousRank), isNew: row.isNew, movementReason: row.movementReason ?? undefined, coverage: Number(row.coverage), price: cost ? Number(cost.value) : input && output ? Number(input.value) * .75 + Number(output.value) * .25 : undefined, speed: speed ? Number(speed.value) : undefined, latency: latency ? Number(latency.value) : undefined, confidence, components: Object.fromEntries(Object.entries(breakdown).filter(([key, leaf]) => !key.startsWith("axis:") && leaf.normalized !== undefined).map(([key, leaf]) => [leaf.benchmarkName ?? metricLabels[key] ?? key, { raw: Number(leaf.raw ?? 0), normalized: Number(leaf.normalized ?? 0), weight: Number(leaf.weight ?? 0), source: sourceFor(leaf) }])) };
    }).sort((left, right) => left.rank - right.rank);
    boards[slug] = { slug, ...boardMeta[slug], entries };
  }
  return { date: overallSnapshot.snapshotDate, previousDate: previous[0]?.date ?? overallSnapshot.snapshotDate, methodVersion: overallSnapshot.methodVersion, inputHash: overallSnapshot.inputHash, boards };
}

export async function loadPublicData(): Promise<PublicData> {
  noStore();
  const db = getDb();
  const fallback = localizePublicSnapshot(latestSnapshot());
  const fallbackHealth: PublicHealth = { latestSnapshotAt: fallback.date, sourceCoverage: 0, publishedModels: fallback.boards.overall.entries.length, methodVersion: fallback.methodVersion, stale: true };
  if (!db) return { snapshot: fallback, source: "fallback", health: fallbackHealth, notice: "영속 데이터베이스가 연결되지 않아 검증된 기준 스냅샷을 표시합니다." };
  try {
    const snapshot = await loadPublicSnapshotFromDb(db);
    if (!snapshot) return { snapshot: fallback, source: "fallback", health: fallbackHealth, notice: "아직 공개된 DB 스냅샷이 없어 검증된 기준 스냅샷을 표시합니다." };
    const run = (await db.select().from(pipelineRuns).orderBy(desc(pipelineRuns.completedAt)).limit(1))[0];
    const completedAt = run?.completedAt?.toISOString();
    const stale = !run?.completedAt || Date.now() - run.completedAt.getTime() > 26 * 60 * 60 * 1000;
    return { snapshot, source: "database", health: { latestSnapshotAt: snapshot.date, lastCronSuccessAt: completedAt, sourceCoverage: Number(run?.coverage ?? 0), publishedModels: Number(run?.publishedModels ?? snapshot.boards.overall.entries.length), methodVersion: snapshot.methodVersion, stale } };
  } catch {
    return { snapshot: fallback, source: "fallback", health: fallbackHealth, notice: "최신 스냅샷을 읽지 못해 마지막 검증 기준 스냅샷을 표시합니다." };
  }
}

export const modelsFromSnapshot = (snapshot: Snapshot) => snapshot.boards.overall.entries.map((entry) => entry.model);
