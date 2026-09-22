import { z } from "zod";
import { getDb } from "@/db/client";
import { rollbackBoard } from "@/ingest/pipeline/runner";

const requestSchema = z.object({ boardSlug: z.enum(["overall", "coding", "agentic", "value", "speed", "korean"]), snapshotId: z.string().uuid() });
export const runtime = "nodejs";
export async function POST(request: Request) {
  const token = process.env.ADMIN_TOKEN;
  if (!token || request.headers.get("authorization") !== `Bearer ${token}`) return new Response("Unauthorized", { status: 401 });
  const db = getDb(); if (!db) return Response.json({ error: "DATABASE_URL is not configured" }, { status: 503 });
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  await rollbackBoard(db, parsed.data.boardSlug, parsed.data.snapshotId);
  return Response.json({ status: "rolled_back", ...parsed.data });
}
