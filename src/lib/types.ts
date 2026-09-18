export type BoardSlug = "overall" | "coding" | "price";
export type BenchmarkKey = "gpqa" | "sweBench" | "aime";

export type Source = { label: string; url: string; observedAt: string; tier: "T1" | "T3" };
export type Metric = { label: string; raw: number; source: Source };
export type Model = { slug: string; name: string; provider: string; version: string; context: number; inputPrice: number; outputPrice: number; priceSource: Source; metrics: Record<BenchmarkKey, Metric> };
export type RankedEntry = { model: Model; rank: number; value: number; previousRank?: number; components: Record<string, { raw: number; normalized: number; weight: number; source: Source }> };
export type Board = { slug: BoardSlug; label: string; description: string; entries: RankedEntry[]; kind: "score" | "spec" };
export type Snapshot = { date: string; previousDate: string; methodVersion: string; inputHash: string; boards: Record<BoardSlug, Board> };
