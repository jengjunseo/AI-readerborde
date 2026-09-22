import { createHash } from "node:crypto";
import { z } from "zod";
import type { AdapterResult, ExternalRecord, SourceAdapter } from "./types";

const maybeNumber = z.preprocess((value) => {
  if (value === null || value === undefined || value === "" || value === "$undefined") return null;
  const number = Number(value); return Number.isFinite(number) ? number : null;
}, z.number().nullable()).optional();
const modelSchema = z.object({
  slug: z.string(),
  name: z.string(),
  deprecated: z.boolean().optional().default(false),
  modelCreatorName: z.string(),
  contextWindowTokens: maybeNumber,
  intelligenceIndex: maybeNumber,
  intelligenceIndexCostPerTask: maybeNumber,
  medianOutputTokensPerSecond: maybeNumber,
  medianTimeToFirstTokenSeconds: maybeNumber,
  terminalBench40: maybeNumber,
  scicode: maybeNumber,
  hle: maybeNumber,
  gpqa: maybeNumber,
  gdpvalNormalized: maybeNumber,
  analystAgent: maybeNumber,
  apexAgents: maybeNumber,
  itbenchSre: maybeNumber,
  lcr: maybeNumber,
  mmmuPro: maybeNumber,
  price1mInputTokens: maybeNumber,
  price1mOutputTokens: maybeNumber,
});

type AAModel = z.infer<typeof modelSchema>;
const sourceUrl = "https://artificialanalysis.ai/leaderboards/models";
const percentMetrics: Array<[keyof AAModel, string, string, string]> = [
  ["gpqa", "gpqa", "GPQA Diamond", "v4.3.2"],
  ["hle", "hle", "Humanity's Last Exam", "v4.3.2"],
  ["terminalBench40", "terminal_bench", "Terminal-Bench", "4.0"],
  ["scicode", "scicode", "SciCode", "v4.3.2"],
  ["gdpvalNormalized", "gdpval", "GDPval-AA", "2.1"],
  ["analystAgent", "analyst_agent", "AA-Briefcase / Analyst Agent", "1.1"],
  ["apexAgents", "apex_agents", "APEX Agents", "1"],
  ["itbenchSre", "itbench_sre", "ITBench SRE", "1"],
  ["lcr", "long_context", "AA-LCR", "1.1"],
  ["mmmuPro", "multimodal", "MMMU-Pro", "1"],
];

function parseModels(html: string): AAModel[] {
  const token = '\\"models\\":[';
  const candidates: number[] = [];
  for (let index = html.indexOf(token); index >= 0; index = html.indexOf(token, index + token.length)) candidates.push(index);
  const start = candidates.find((index) => html.slice(index, index + 2_000).includes("intelligenceIndex")) ?? -1;
  if (start < 0) throw new Error("Artificial Analysis model payload not found");
  const contentStart = start + token.length;
  const end = html.indexOf('],\\"messages\\"', contentStart);
  if (end < 0) throw new Error("Artificial Analysis model payload terminator not found");
  const decoded = `[${html.slice(contentStart, end).replace(/\\\"/g, '"')}]`;
  return z.array(modelSchema).parse(JSON.parse(decoded));
}

function familySlug(slug: string) {
  return slug.replace(/-(xhigh|high|medium|low)(?:-.*)?$/, "");
}

function selectCurrent(models: AAModel[]) {
  const seen = new Set<string>();
  return models
    .filter((model) => !model.deprecated && model.intelligenceIndex != null)
    .sort((left, right) => Number(right.intelligenceIndex) - Number(left.intelligenceIndex))
    .filter((model) => {
      const family = familySlug(model.slug);
      if (seen.has(family)) return false;
      seen.add(family);
      return true;
    })
    .slice(0, 16);
}

export const artificialAnalysisAdapter: SourceAdapter = {
  id: "artificial-analysis",
  name: "Artificial Analysis",
  tier: "T2",
  homepageUrl: sourceUrl,
  termsUrl: "https://artificialanalysis.ai/terms-of-use",
  adapterVersion: "2.0.0",
  canCreateIdentity: true,
  async fetch(): Promise<AdapterResult> {
    const response = await fetch(sourceUrl, { headers: { "User-Agent": "AI-SCOREBOARD/2.0" }, next: { revalidate: 0 } });
    if (!response.ok) throw new Error(`Artificial Analysis returned ${response.status}`);
    const html = await response.text();
    const selected = selectCurrent(parseModels(html));
    if (selected.length < 10) throw new Error("Artificial Analysis returned fewer than 10 eligible models");
    const observedAt = new Date().toISOString().slice(0, 10);
    const records: ExternalRecord[] = [];
    for (const model of selected) {
      records.push({ kind: "model_meta", externalId: model.slug, provider: model.modelCreatorName, modelSlug: model.slug, name: model.name, version: model.slug, contextLength: model.contextWindowTokens ?? 0, sourceUrl, observedAt });
      const add = (metricKey: string, benchmarkName: string, value: number | null | undefined, unit: string, benchmarkVersion?: string) => {
        if (typeof value !== "number" || !Number.isFinite(value)) return;
        records.push({ kind: "metric", externalId: model.slug, metricKey, benchmarkName, benchmarkVersion, value, unit, sourceUrl, observedAt, licenseTermsNote: "Public leaderboard observation; attribution required. Underlying benchmark terms may vary." });
      };
      for (const [field, key, label, version] of percentMetrics) {
        const value = model[field] as number | null | undefined;
        add(key, label, typeof value === "number" ? value * 100 : value, "%", version);
      }
      add("intelligence_index", "Artificial Analysis Intelligence Index", model.intelligenceIndex, "index", "4.3.2");
      add("cost_per_task", "Cost per Intelligence Index task", model.intelligenceIndexCostPerTask, "USD / task", "4.3.2");
      add("output_speed", "Median output speed", model.medianOutputTokensPerSecond, "tokens / second");
      add("latency", "Median time to first token", model.medianTimeToFirstTokenSeconds, "seconds");
      add("input_price", "Observed input price", model.price1mInputTokens, "USD / 1M tokens");
      add("output_price", "Observed output price", model.price1mOutputTokens, "USD / 1M tokens");
    }
    const fingerprint = createHash("sha256").update(JSON.stringify(selected)).digest("hex");
    return { records, fingerprint, payload: { observedAt, modelCount: selected.length, models: selected } };
  },
};
