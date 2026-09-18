import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { publishedPointers, rankingSnapshots } from "@/db/schema";

export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: Promise<{ date: string }> }) {
  const db = getDb(); if (!db) return Response.json({ error: "DATABASE_URL is not configured" }, { status: 503 });
  const { date } = await params;
  const snapshots = await db.select().from(rankingSnapshots).where(eq(rankingSnapshots.snapshotDate, date));
  if (!snapshots.length) return Response.json({ error: "Snapshot not found" }, { status: 404 });
  const pointers = await db.select().from(publishedPointers);
  return Response.json({ date, snapshots, publishedPointers: pointers });
}
