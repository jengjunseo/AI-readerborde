import { latestSnapshot } from "@/lib/catalog";
export function GET() { const snapshot = latestSnapshot(); return Response.json({ status: "ok", snapshot: snapshot.date, methodVersion: snapshot.methodVersion, inputHash: snapshot.inputHash }); }
