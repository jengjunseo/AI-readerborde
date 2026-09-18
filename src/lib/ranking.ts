import { createHash } from "node:crypto";
import type { Model, RankedEntry, Snapshot } from "./types";

const anchors = { gpqa: [30, 90], sweBench: [20, 85], aime: [30, 100] } as const;
const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
export const normalize = (value: number, [floor, ceiling]: readonly [number, number]) => clamp(((value - floor) / (ceiling - floor)) * 100);
export const blendedPrice = (model: Model) => model.inputPrice * 0.75 + model.outputPrice * 0.25;

function scoreEntry(model: Model, board: "overall" | "coding"): RankedEntry {
  const weights = board === "overall" ? { gpqa: 0.4, sweBench: 0.4, aime: 0.2 } : { sweBench: 1 };
  const components = Object.fromEntries(Object.entries(weights).map(([key, weight]) => {
    const metric = model.metrics[key as keyof typeof model.metrics];
    return [metric.label, { raw: metric.raw, normalized: normalize(metric.raw, anchors[key as keyof typeof anchors]), weight, source: metric.source }];
  }));
  const value = Object.values(components).reduce((total, component) => total + component.normalized * component.weight, 0);
  return { model, rank: 0, value, components };
}
function rank(entries: RankedEntry[], ascending = false): RankedEntry[] { return [...entries].sort((a, b) => ascending ? a.value - b.value : b.value - a.value).map((entry, index) => ({ ...entry, rank: index + 1 })); }

export function buildSnapshot(models: Model[], date: string, previous?: Snapshot): Snapshot {
  const overall = rank(models.map((model) => scoreEntry(model, "overall")));
  const coding = rank(models.map((model) => scoreEntry(model, "coding")));
  const price = rank(models.map((model) => ({ model, rank: 0, value: blendedPrice(model), components: { "Blended API price (3:1 input:output)": { raw: blendedPrice(model), normalized: 0, weight: 1, source: model.priceSource } } })), true);
  const previousRanks = previous ? Object.fromEntries(Object.entries(previous.boards).map(([slug, board]) => [slug, Object.fromEntries(board.entries.map((entry) => [entry.model.slug, entry.rank]))])) : {};
  const attachPrevious = (slug: string, entries: RankedEntry[]) => entries.map((entry) => ({ ...entry, previousRank: previousRanks[slug]?.[entry.model.slug] as number | undefined }));
  const boards: Snapshot["boards"] = {
    overall: { slug: "overall", label: "Overall", description: "Fixed-anchor composite of reasoning, coding, and math evidence.", kind: "score", entries: attachPrevious("overall", overall) },
    coding: { slug: "coding", label: "Coding", description: "SWE-bench Verified, normalized with fixed published anchors.", kind: "score", entries: attachPrevious("coding", coding) },
    price: { slug: "price", label: "Cheapest", description: "Blended API price per 1M tokens (3:1 input:output). Lower is better.", kind: "spec", entries: attachPrevious("price", price) },
  };
  const inputHash = createHash("sha256").update(JSON.stringify(models)).digest("hex").slice(0, 12);
  return { date, previousDate: previous?.date ?? date, methodVersion: "v1", inputHash, boards };
}
