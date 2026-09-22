import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { boardScores, models, modelVersions, providers, publishedPointers, rankingEntries, rankingSnapshots } from "@/db/schema";

export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const db = getDb(); if (!db) return Response.json({ error: "DATABASE_URL is not configured" }, { status: 503 });
  const { slug } = await params;
  const pointer = (await db.select().from(publishedPointers).where(eq(publishedPointers.boardSlug, slug)))[0];
  if (!pointer) return Response.json({ error: "Board not published" }, { status: 404 });
  const snapshot = (await db.select().from(rankingSnapshots).where(eq(rankingSnapshots.id, pointer.snapshotId)))[0];
  const entries = (await db.select({ rank: rankingEntries.rank, value: rankingEntries.value, previousRank: rankingEntries.previousRank, isNew: rankingEntries.isNew, model: models.name, modelSlug: models.slug, provider: providers.name, version: modelVersions.version, breakdown: boardScores.breakdown, coverage: boardScores.coverage }).from(rankingEntries).innerJoin(modelVersions, eq(rankingEntries.modelVersionId, modelVersions.id)).innerJoin(models, eq(modelVersions.modelId, models.id)).innerJoin(providers, eq(models.providerId, providers.id)).innerJoin(boardScores, and(eq(boardScores.pipelineRunId, snapshot.pipelineRunId), eq(boardScores.modelVersionId, modelVersions.id), eq(boardScores.boardSlug, slug))).where(eq(rankingEntries.snapshotId, snapshot.id))).sort((left, right) => Number(left.rank) - Number(right.rank));
  return Response.json({ snapshot: { date: snapshot.snapshotDate, methodVersion: snapshot.methodVersion, inputHash: snapshot.inputHash }, board: slug, entries });
}
