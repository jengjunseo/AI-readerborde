import { curatedModels } from "../src/lib/curated-data";
import { buildSnapshot } from "../src/lib/ranking";
const date = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const snapshot = buildSnapshot(curatedModels, date);
console.log(JSON.stringify({ status: "validated", date: snapshot.date, methodVersion: snapshot.methodVersion, inputHash: snapshot.inputHash, boards: Object.fromEntries(Object.entries(snapshot.boards).map(([slug, board]) => [slug, board.entries.length])) }, null, 2));
