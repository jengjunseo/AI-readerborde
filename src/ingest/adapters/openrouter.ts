import { createHash } from "node:crypto";
import { z } from "zod";
import type { AdapterResult, ExternalRecord, SourceAdapter } from "./types";

const responseSchema = z.object({ data: z.array(z.object({ id: z.string(), name: z.string(), context_length: z.number().optional(), pricing: z.object({ prompt: z.string().optional(), completion: z.string().optional() }).optional() })) });
export const openRouterAdapter: SourceAdapter = {
  id: "openrouter", name: "OpenRouter model catalog", tier: "T2", homepageUrl: "https://openrouter.ai/models", termsUrl: "https://openrouter.ai/terms", adapterVersion: "1.1.0",
  async fetch(): Promise<AdapterResult> {
    const response = await fetch("https://openrouter.ai/api/v1/models?sort=intelligence-high-to-low", { headers: { "User-Agent": "AI-SCOREBOARD/2.0" }, next: { revalidate: 0 } });
    if (!response.ok) throw new Error(`OpenRouter returned ${response.status}`);
    const payload = responseSchema.parse(await response.json());
    const observedAt = new Date().toISOString().slice(0, 10);
    const records: ExternalRecord[] = payload.data.flatMap((model) => {
      const sourceUrl = `https://openrouter.ai/${model.id}`;
      const provider = model.id.split("/")[0] ?? "unknown";
      const modelSlug = model.id.split("/").slice(1).join("-").replace(/:.*$/, "").replace(/\./g, "-").replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
      const base: ExternalRecord[] = [{ kind: "model_meta", externalId: model.id, provider, modelSlug, name: model.name.replace(/^[^:]+:\s*/, ""), version: model.id, contextLength: model.context_length ?? 0, sourceUrl, observedAt }];
      const input = Number(model.pricing?.prompt); const output = Number(model.pricing?.completion);
      if (Number.isFinite(input)) base.push({ kind: "metric", externalId: model.id, metricKey: "input_price", benchmarkName: "OpenRouter input price", unit: "USD / 1M tokens", value: input * 1_000_000, sourceUrl, observedAt, licenseTermsNote: "Public catalog metadata; verify provider-specific endpoint terms." });
      if (Number.isFinite(output)) base.push({ kind: "metric", externalId: model.id, metricKey: "output_price", benchmarkName: "OpenRouter output price", unit: "USD / 1M tokens", value: output * 1_000_000, sourceUrl, observedAt, licenseTermsNote: "Public catalog metadata; verify provider-specific endpoint terms." });
      return base;
    });
    return { records, payload, fingerprint: createHash("sha256").update(JSON.stringify(payload.data.map((model) => model.id))).digest("hex") };
  },
};
