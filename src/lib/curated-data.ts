import type { Model } from "./types";

const source = (label: string, url: string, tier: "T1" | "T3" = "T3") => ({ label, url, tier, observedAt: "2025-09-18" });
const official = (label: string, url: string) => source(label, url, "T1");
const model = (slug: string, name: string, provider: string, version: string, inputPrice: number, outputPrice: number, gpqa: number, sweBench: number, aime: number, url: string, context = 200_000): Model => ({
  slug, name, provider, version, context, inputPrice, outputPrice, priceSource: official(`${provider} pricing`, url),
  metrics: {
    gpqa: { label: "GPQA Diamond", raw: gpqa, source: source("Model technical report", url) },
    sweBench: { label: "SWE-bench Verified", raw: sweBench, source: source("SWE-bench Verified leaderboard", "https://www.swebench.com/") },
    aime: { label: "AIME 2025", raw: aime, source: source("Model technical report", url) },
  },
});

// Public technical-report values and official list prices, kept deliberately small for the first vertical slice.
// Every leaf includes an observation date and source rather than presenting this curated seed as live telemetry.
export const curatedModels: Model[] = [
  model("o3", "o3", "OpenAI", "o3-2025-04-16", 2, 8, 83.3, 69.1, 88.9, "https://openai.com/api/pricing/"),
  model("gpt-4-1", "GPT-4.1", "OpenAI", "gpt-4-1-2025-04-14", 2, 8, 66.3, 54.6, 80.0, "https://openai.com/api/pricing/", 1_000_000),
  model("claude-opus-4", "Claude Opus 4", "Anthropic", "claude-opus-4-20250514", 15, 75, 74.9, 72.5, 75.5, "https://docs.anthropic.com/en/docs/about-claude/models"),
  model("claude-sonnet-4", "Claude Sonnet 4", "Anthropic", "claude-sonnet-4-20250514", 3, 15, 70.0, 72.7, 70.5, "https://docs.anthropic.com/en/docs/about-claude/models"),
  model("gemini-2-5-pro", "Gemini 2.5 Pro", "Google", "gemini-2.5-pro-preview", 1.25, 10, 84.0, 63.8, 86.7, "https://ai.google.dev/gemini-api/docs/pricing"),
  model("gemini-2-5-flash", "Gemini 2.5 Flash", "Google", "gemini-2.5-flash-preview", 0.3, 2.5, 78.3, 63.0, 83.0, "https://ai.google.dev/gemini-api/docs/pricing"),
  model("grok-3", "Grok 3", "xAI", "grok-3-beta", 3, 15, 84.6, 69.0, 93.3, "https://docs.x.ai/docs/models"),
  model("deepseek-r1", "DeepSeek R1", "DeepSeek", "deepseek-reasoner", 0.55, 2.19, 71.5, 49.2, 79.8, "https://api-docs.deepseek.com/quick_start/pricing"),
  model("qwen3-235b", "Qwen3 235B", "Alibaba", "qwen3-235b-a22b", 0.2, 0.8, 71.1, 62.8, 85.7, "https://help.aliyun.com/zh/model-studio/models"),
  model("mistral-medium-3", "Mistral Medium 3", "Mistral", "mistral-medium-3", 0.4, 2, 65.0, 55.0, 75.0, "https://docs.mistral.ai/platform/pricing/"),
];
