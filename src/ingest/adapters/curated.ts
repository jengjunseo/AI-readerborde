import { createHash } from "node:crypto";
import { curatedModels } from "@/lib/curated-data";
import type { AdapterResult, ExternalRecord, SourceAdapter } from "./types";

export const curatedAdapter: SourceAdapter = {
  id: "curated", name: "Curated public records", tier: "T1", homepageUrl: "https://www.swebench.com/", adapterVersion: "1.1.0", canCreateIdentity: true,
  async fetch(): Promise<AdapterResult> {
    const records: ExternalRecord[] = curatedModels.flatMap((model) => [
      { kind: "model_meta" as const, externalId: model.slug, provider: model.provider, modelSlug: model.slug, name: model.name, version: model.version, contextLength: model.context, sourceUrl: model.priceSource.url, observedAt: model.priceSource.observedAt },
      { kind: "metric" as const, externalId: model.slug, metricKey: "input_price", benchmarkName: "API input price", unit: "USD / 1M tokens", value: model.inputPrice, sourceUrl: model.priceSource.url, observedAt: model.priceSource.observedAt },
      { kind: "metric" as const, externalId: model.slug, metricKey: "output_price", benchmarkName: "API output price", unit: "USD / 1M tokens", value: model.outputPrice, sourceUrl: model.priceSource.url, observedAt: model.priceSource.observedAt },
      { kind: "metric" as const, externalId: model.slug, metricKey: "gpqa", benchmarkName: "GPQA Diamond", unit: "%", value: model.metrics.gpqa.raw, sourceUrl: model.metrics.gpqa.source.url, observedAt: model.metrics.gpqa.source.observedAt },
      { kind: "metric" as const, externalId: model.slug, metricKey: "swe_bench", benchmarkName: "SWE-bench Verified", unit: "% resolved", value: model.metrics.sweBench.raw, sourceUrl: model.metrics.sweBench.source.url, observedAt: model.metrics.sweBench.source.observedAt },
      { kind: "metric" as const, externalId: model.slug, metricKey: "aime", benchmarkName: "AIME 2025", unit: "%", value: model.metrics.aime.raw, sourceUrl: model.metrics.aime.source.url, observedAt: model.metrics.aime.source.observedAt },
    ]);
    return { records, payload: records, fingerprint: createHash("sha256").update(JSON.stringify(records)).digest("hex") };
  },
};
