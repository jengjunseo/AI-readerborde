export type ExternalRecord =
  | { kind: "model_meta"; externalId: string; provider: string; modelSlug: string; name: string; version: string; contextLength: number; sourceUrl: string; observedAt: string }
  | { kind: "metric"; externalId: string; metricKey: "gpqa" | "swe_bench" | "aime" | "input_price" | "output_price"; value: number; sourceUrl: string; observedAt: string };

export type AdapterResult = { records: ExternalRecord[]; fingerprint: string; payload: unknown };
export interface SourceAdapter { id: string; name: string; tier: "T1" | "T2" | "T3"; homepageUrl: string; fetch(): Promise<AdapterResult>; }
