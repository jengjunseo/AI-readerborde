import { createHash } from "node:crypto";
import { curatedModels } from "@/lib/curated-data";
import type { AdapterResult, ExternalRecord, SourceAdapter } from "./types";

export const curatedAdapter: SourceAdapter = {
  id: "curated", name: "Curated public records", tier: "T1", homepageUrl: "https://www.swebench.com/",
  async fetch(): Promise<AdapterResult> {
    const records: ExternalRecord[] = curatedModels.flatMap((model) => [
      { kind: "model_meta" as const, externalId: model.slug, provider: model.provider, modelSlug: model.slug, name: model.name, version: model.version, contextLength: model.context, sourceUrl: model.priceSource.url, observedAt: model.priceSource.observedAt },
      { kind: "metric" as const, externalId: model.slug, metricKey: "input_price" as const, value: model.inputPrice, sourceUrl: model.priceSource.url, observedAt: model.priceSource.observedAt },
      { kind: "metric" as const, externalId: model.slug, metricKey: "output_price" as const, value: model.outputPrice, sourceUrl: model.priceSource.url, observedAt: model.priceSource.observedAt },
      { kind: "metric" as const, externalId: model.slug, metricKey: "gpqa" as const, value: model.metrics.gpqa.raw, sourceUrl: model.metrics.gpqa.source.url, observedAt: model.metrics.gpqa.source.observedAt },
      { kind: "metric" as const, externalId: model.slug, metricKey: "swe_bench" as const, value: model.metrics.sweBench.raw, sourceUrl: model.metrics.sweBench.source.url, observedAt: model.metrics.sweBench.source.observedAt },
      { kind: "metric" as const, externalId: model.slug, metricKey: "aime" as const, value: model.metrics.aime.raw, sourceUrl: model.metrics.aime.source.url, observedAt: model.metrics.aime.source.observedAt },
    ]);
    return { records, payload: records, fingerprint: createHash("sha256").update(JSON.stringify(records)).digest("hex") };
  },
};
