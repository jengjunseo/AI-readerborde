import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { boardScores, models, modelVersions, providers, rankingEntries, rankingSnapshots } from "@/db/schema";
import { boardMeta, boardOrder } from "./board-meta";
import type { Board, BoardSlug, Snapshot } from "./types";

export async function loadHistoricalSnapshot(date: string): Promise<Snapshot | undefined> {
  const db = getDb(); if (!db) return undefined;
  const all = await db.select().from(rankingSnapshots).where(eq(rankingSnapshots.snapshotDate, date)).orderBy(desc(rankingSnapshots.createdAt));
  const snapshots = boardOrder.map((board) => all.find((snapshot) => snapshot.boardSlug === board)).filter((snapshot): snapshot is typeof all[number] => Boolean(snapshot));
  const overall = snapshots.find((snapshot) => snapshot.boardSlug === "overall"); if (!overall) return undefined;
  const rows = await db.select({ snapshotId: rankingEntries.snapshotId, modelSlug: models.slug, modelName: models.name, provider: providers.name, lifecycle: models.lifecycle, version: modelVersions.version, context: modelVersions.contextLength, rank: rankingEntries.rank, value: rankingEntries.value, previousRank: rankingEntries.previousRank, isNew: rankingEntries.isNew, movementReason: rankingEntries.movementReason, coverage: boardScores.coverage, breakdown: boardScores.breakdown }).from(rankingEntries).innerJoin(rankingSnapshots, eq(rankingEntries.snapshotId, rankingSnapshots.id)).innerJoin(modelVersions, eq(rankingEntries.modelVersionId, modelVersions.id)).innerJoin(models, eq(modelVersions.modelId, models.id)).innerJoin(providers, eq(models.providerId, providers.id)).innerJoin(boardScores, and(eq(boardScores.pipelineRunId, overall.pipelineRunId), eq(boardScores.modelVersionId, modelVersions.id), eq(boardScores.boardSlug, rankingSnapshots.boardSlug))).where(inArray(rankingEntries.snapshotId, snapshots.map((snapshot) => snapshot.id)));
  const boards = {} as Record<BoardSlug, Board>;
  for (const slug of boardOrder) {
    const snapshot = snapshots.find((item) => item.boardSlug === slug);
    const entries = rows.filter((row) => row.snapshotId === snapshot?.id).map((row) => {
      const breakdown = (row.breakdown ?? {}) as Record<string, { raw?: number; normalized?: number; weight?: number; sourceUrl?: string; observedAt?: string; benchmarkName?: string }>;
      const source = { label: "historical observation", url: "#", observedAt: date, tier: "T2" as const };
      return { model: { slug: row.modelSlug, name: row.modelName, provider: row.provider, version: row.version, context: Number(row.context), lifecycle: row.lifecycle, inputPrice: 0, outputPrice: 0, priceSource: source, metrics: {} }, rank: Number(row.rank), value: Number(row.value), previousRank: row.previousRank === null ? undefined : Number(row.previousRank), isNew: row.isNew, movementReason: row.movementReason ?? undefined, coverage: Number(row.coverage), components: Object.fromEntries(Object.entries(breakdown).filter(([key, leaf]) => !key.startsWith("axis:") && leaf.normalized !== undefined).map(([key, leaf]) => [leaf.benchmarkName ?? key, { raw: Number(leaf.raw ?? 0), normalized: Number(leaf.normalized ?? 0), weight: Number(leaf.weight ?? 0), source: { label: leaf.sourceUrl ? new URL(leaf.sourceUrl).hostname : "source", url: leaf.sourceUrl ?? "#", observedAt: leaf.observedAt ?? date, tier: "T2" as const } }])) };
    }).sort((a, b) => a.rank - b.rank);
    boards[slug] = { slug, ...boardMeta[slug], entries };
  }
  return { date, previousDate: date, methodVersion: overall.methodVersion, inputHash: overall.inputHash, boards };
}
