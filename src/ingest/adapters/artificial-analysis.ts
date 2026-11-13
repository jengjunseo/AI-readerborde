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
  scores: z.record(z.string(), maybeNumber).optional(),
  outputSpeed: maybeNumber,
  timeToFirstToken: maybeNumber,
}).transform((row) => ({
  ...row,
  gpqa: row.gpqa ?? row.scores?.["gpqa-diamond"],
  hle: row.hle ?? row.scores?.["humanitys-last-exam"],
  terminalBench40: row.terminalBench40 ?? row.scores?.["terminalbench-4-0"],
  scicode: row.scicode ?? row.scores?.scicode,
  analystAgent: row.analystAgent ?? row.scores?.["aa-analyst-agent"],
  apexAgents: row.apexAgents ?? row.scores?.["apex-agents-aa"],
  itbenchSre: row.itbenchSre ?? row.scores?.["itbench-aa"],
  lcr: row.lcr ?? row.scores?.["artificial-analysis-long-context-reasoning"],
  mmmuPro: row.mmmuPro ?? row.scores?.["mmmu-pro"],
  medianOutputTokensPerSecond: row.medianOutputTokensPerSecond ?? row.outputSpeed,
  medianTimeToFirstTokenSeconds: row.medianTimeToFirstTokenSeconds ?? row.timeToFirstToken,
  // Nested GDPval and AA-Briefcase are now Elo, not success proportions.
  // Do not reinterpret either as the legacy normalized percentage.
}));

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

function decodeFlight(html: string): string {
  // Decode data, never execute the source's scripts. Flight can split a model
  // object (or even a property name) across independently encoded chunks.
  const chunks: string[] = [];
  for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    const call = script[1].match(/self\.__next_f\.push\((\[[\s\S]*\])\)\s*;?\s*$/);
    if (!call) continue;
    const chunk: unknown = JSON.parse(call[1]);
    if (Array.isArray(chunk) && chunk[0] === 1 && typeof chunk[1] === "string") chunks.push(chunk[1]);
  }
  return chunks.join("");
}

export function parseIndexVersion(html: string): string | undefined {
  return decodeFlight(html).match(/"intelligenceIndex"\s*:\s*\{\s*"slug"\s*:\s*"artificial-analysis-intelligence-index"\s*,\s*"name"\s*:\s*"Artificial Analysis Intelligence Index v([0-9.]+)"/)?.[1];
}

export function parseModels(html: string): AAModel[] {
  const decoded = decodeFlight(html);
  for (const field of decoded.matchAll(/"(?:initialModels|models)"\s*:\s*\[/g)) {
    const start = field.index + field[0].length - 1;
    let depth = 0;
    let quoted = false;
    let escaped = false;
    for (let index = start; index < decoded.length; index++) {
      const char = decoded[index];
      if (quoted) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') quoted = false;
      } else if (char === '"') quoted = true;
      else if (char === "[") depth++;
      else if (char === "]" && --depth === 0) {
        const candidate: unknown = JSON.parse(decoded.slice(start, index + 1));
        // Ignore unrelated model pickers; only accept the evaluation dataset.
        if (Array.isArray(candidate) && candidate.some((row) => row && typeof row === "object" && "intelligenceIndex" in row)) {
          return z.array(modelSchema).parse(candidate);
        }
        break;
      }
    }
  }
  throw new Error("Artificial Analysis model payload not found or incomplete");
}

function familySlug(slug: string) {
  return slug.replace(/-(max|xhigh|high|medium|low)(?:-.*)?$/, "");
}

export function selectCurrent<T extends Pick<AAModel, "slug" | "deprecated" | "intelligenceIndex">>(models: T[]) {
  const seen = new Set<string>();
  const eligible = models
    .filter((model) => !model.deprecated && model.intelligenceIndex != null)
    .sort((left, right) => Number(right.intelligenceIndex) - Number(left.intelligenceIndex))
    .filter((model) => {
      const family = familySlug(model.slug);
      if (seen.has(family)) return false;
      seen.add(family);
      return true;
    });
  const selected = eligible.slice(0, 16);
  for (const slug of ["gpt-6-sol", "gpt-6-luna"]) {
    const required = eligible.find((model) => familySlug(model.slug) === slug);
    if (required && !selected.some((model) => model.slug === required.slug)) selected.push(required);
  }
  return selected;
}

export const artificialAnalysisAdapter: SourceAdapter = {
  id: "artificial-analysis",
  name: "Artificial Analysis",
  tier: "T2",
  homepageUrl: sourceUrl,
  termsUrl: "https://artificialanalysis.ai/terms-of-use",
  adapterVersion: "2.2.0",
  canCreateIdentity: true,
  async fetch(): Promise<AdapterResult> {
    const response = await fetch(sourceUrl, { headers: { "User-Agent": "AI-SCOREBOARD/2.0" }, next: { revalidate: 0 } });
    if (!response.ok) throw new Error(`Artificial Analysis returned ${response.status}`);
    const html = await response.text();
    const selected = selectCurrent(parseModels(html));
    const indexVersion = parseIndexVersion(html) ?? (selected.every((model) => !model.scores) ? "4.3.2" : undefined);
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
        if (typeof value === "number" && (value < 0 || value > 1)) throw new Error(`Unexpected non-proportion for ${model.slug}/${key}`);
        const benchmarkVersion = model.scores && version === "v4.3.2" ? undefined : version;
        add(key, label, typeof value === "number" ? value * 100 : value, "%", benchmarkVersion);
      }
      add("intelligence_index", "Artificial Analysis Intelligence Index", model.intelligenceIndex, "index", indexVersion);
      add("cost_per_task", "Cost per Intelligence Index task", model.intelligenceIndexCostPerTask, "USD / task", indexVersion);
      add("output_speed", "Median output speed", model.medianOutputTokensPerSecond, "tokens / second");
      add("latency", "Median time to first token", model.medianTimeToFirstTokenSeconds, "seconds");
      add("input_price", "Observed input price", model.price1mInputTokens, "USD / 1M tokens");
      add("output_price", "Observed output price", model.price1mOutputTokens, "USD / 1M tokens");
    }
    const fingerprint = createHash("sha256").update(JSON.stringify(selected)).digest("hex");
    return { records, fingerprint, payload: { observedAt, modelCount: selected.length, indexVersion, models: selected } };
  },
};
