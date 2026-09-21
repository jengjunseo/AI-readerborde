import { unstable_noStore as noStore } from "next/cache";
import { and, desc, eq, lt } from "drizzle-orm";
import { getDb, type AppDb } from "@/db/client";
import {
  boardScores,
  models,
  modelVersions,
  providers,
  publishedPointers,
  rankingEntries,
  rankingSnapshots,
} from "@/db/schema";
import { latestSnapshot } from "./catalog";
import { curatedModels } from "./curated-data";
import type { Board, BoardSlug, Model, RankedEntry, Snapshot, Source } from "./types";

type BreakdownLeaf = {
  raw?: number;
  normalized?: number;
  weight?: number;
  sourceUrl?: string;
  observedAt?: string;
};

const boardMeta: Record<BoardSlug, Pick<Board, "label" | "description" | "kind">> = {
  overall: { label: "종합", description: "추론·코딩·수학 근거를 고정 기준으로 정규화한 종합 점수입니다.", kind: "score" },
  coding: { label: "코딩", description: "SWE-bench Verified 원점수를 고정 기준으로 정규화합니다.", kind: "score" },
  price: { label: "비용 효율", description: "입력 75%·출력 25%로 계산한 100만 토큰당 API 가격입니다.", kind: "spec" },
};

const metricLabels: Record<string, string> = {
  gpqa: "GPQA Diamond",
  swe_bench: "SWE-bench Verified",
  aime: "AIME 2025",
};

const sourceFor = (leaf: BreakdownLeaf): Source => ({
  label: leaf.sourceUrl ? new URL(leaf.sourceUrl).hostname.replace(/^www\./, "") : "출처 미상",
  url: leaf.sourceUrl ?? "#",
  observedAt: leaf.observedAt ?? "UNKNOWN",
  tier: "T3",
});

const modelFallback = (slug: string, name: string, provider: string, version: string, context: number): Model => {
  const curated = curatedModels.find((model) => model.slug === slug);
  if (curated) return curated;
  const source: Source = { label: "데이터베이스 관측값", url: "#", observedAt: "UNKNOWN", tier: "T3" };
  return {
    slug,
    name,
    provider,
    version,
    context,
    inputPrice: 0,
    outputPrice: 0,
    priceSource: source,
    metrics: {
      gpqa: { label: metricLabels.gpqa, raw: 0, source },
      sweBench: { label: metricLabels.swe_bench, raw: 0, source },
      aime: { label: metricLabels.aime, raw: 0, source },
    },
  };
};

export type PublicData = {
  snapshot: Snapshot;
  source: "database" | "fallback";
  notice?: string;
};

export const localizePublicSnapshot = (snapshot: Snapshot): Snapshot => ({
  ...snapshot,
  boards: Object.fromEntries(
    (Object.keys(boardMeta) as BoardSlug[]).map((slug) => [slug, { ...snapshot.boards[slug], ...boardMeta[slug] }]),
  ) as Record<BoardSlug, Board>,
});

export async function loadPublicSnapshotFromDb(db: AppDb): Promise<Snapshot | undefined> {
  const rows = await db
    .select({
      boardSlug: rankingSnapshots.boardSlug,
      snapshotDate: rankingSnapshots.snapshotDate,
      methodVersion: rankingSnapshots.methodVersion,
      inputHash: rankingSnapshots.inputHash,
      pipelineRunId: rankingSnapshots.pipelineRunId,
      rank: rankingEntries.rank,
      value: rankingEntries.value,
      previousRank: rankingEntries.previousRank,
      modelSlug: models.slug,
      modelName: models.name,
      providerName: providers.name,
      version: modelVersions.version,
      contextLength: modelVersions.contextLength,
      breakdown: boardScores.breakdown,
    })
    .from(publishedPointers)
    .innerJoin(rankingSnapshots, eq(publishedPointers.snapshotId, rankingSnapshots.id))
    .innerJoin(rankingEntries, eq(rankingEntries.snapshotId, rankingSnapshots.id))
    .innerJoin(modelVersions, eq(rankingEntries.modelVersionId, modelVersions.id))
    .innerJoin(models, eq(modelVersions.modelId, models.id))
    .innerJoin(providers, eq(models.providerId, providers.id))
    .innerJoin(
      boardScores,
      and(
        eq(boardScores.pipelineRunId, rankingSnapshots.pipelineRunId),
        eq(boardScores.modelVersionId, modelVersions.id),
        eq(boardScores.boardSlug, rankingSnapshots.boardSlug),
      ),
    );

  if (!rows.length) return undefined;
  const overallSnapshot = rows.find((row) => row.boardSlug === "overall");
  if (!overallSnapshot) return undefined;

  const previous = await db
    .select({ date: rankingSnapshots.snapshotDate })
    .from(rankingSnapshots)
    .where(and(eq(rankingSnapshots.boardSlug, "overall"), lt(rankingSnapshots.snapshotDate, overallSnapshot.snapshotDate)))
    .orderBy(desc(rankingSnapshots.snapshotDate))
    .limit(1);

  const boards = {} as Record<BoardSlug, Board>;
  for (const slug of Object.keys(boardMeta) as BoardSlug[]) {
    const entries: RankedEntry[] = rows
      .filter((row) => row.boardSlug === slug)
      .map((row) => {
        const breakdown = (row.breakdown ?? {}) as Record<string, BreakdownLeaf>;
        return {
          model: modelFallback(row.modelSlug, row.modelName, row.providerName, row.version, Number(row.contextLength)),
          rank: Number(row.rank),
          value: Number(row.value),
          previousRank: row.previousRank === null ? undefined : Number(row.previousRank),
          components: Object.fromEntries(
            Object.entries(breakdown)
              .filter(([, leaf]) => leaf.normalized !== undefined)
              .map(([key, leaf]) => [metricLabels[key] ?? key, {
                raw: Number(leaf.raw ?? 0),
                normalized: Number(leaf.normalized ?? 0),
                weight: Number(leaf.weight ?? 0),
                source: sourceFor(leaf),
              }]),
          ),
        };
      })
      .sort((left, right) => left.rank - right.rank);
    if (!entries.length) return undefined;
    boards[slug] = { slug, ...boardMeta[slug], entries };
  }

  return {
    date: overallSnapshot.snapshotDate,
    previousDate: previous[0]?.date ?? overallSnapshot.snapshotDate,
    methodVersion: overallSnapshot.methodVersion,
    inputHash: overallSnapshot.inputHash,
    boards,
  };
}

export async function loadPublicData(): Promise<PublicData> {
  noStore();
  const db = getDb();
  if (!db) return { snapshot: localizePublicSnapshot(latestSnapshot()), source: "fallback", notice: "영속 데이터베이스가 연결되지 않아 검증된 기준 스냅샷을 표시합니다." };
  try {
    const snapshot = await loadPublicSnapshotFromDb(db);
    if (snapshot) return { snapshot, source: "database" };
    return { snapshot: localizePublicSnapshot(latestSnapshot()), source: "fallback", notice: "아직 공개된 DB 스냅샷이 없어 검증된 기준 스냅샷을 표시합니다." };
  } catch {
    return { snapshot: localizePublicSnapshot(latestSnapshot()), source: "fallback", notice: "최신 스냅샷을 읽지 못해 마지막 검증 기준 스냅샷을 표시합니다." };
  }
}

export const modelsFromSnapshot = (snapshot: Snapshot) => snapshot.boards.overall.entries.map((entry) => entry.model);
