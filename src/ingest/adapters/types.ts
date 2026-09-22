export type ExternalRecord =
  | { kind: "model_meta"; externalId: string; provider: string; modelSlug: string; name: string; version: string; contextLength: number; releaseDate?: string; sourceUrl: string; observedAt: string }
  | { kind: "metric"; externalId: string; metricKey: string; benchmarkName: string; benchmarkVersion?: string; unit: string; value: number; sourceUrl: string; observedAt: string; licenseTermsNote?: string };

export type AdapterResult = { records: ExternalRecord[]; fingerprint: string; payload: unknown };
export interface SourceAdapter { id: string; name: string; tier: "T1" | "T2" | "T3"; homepageUrl: string; termsUrl?: string; adapterVersion: string; canCreateIdentity?: boolean; fetch(): Promise<AdapterResult>; }
