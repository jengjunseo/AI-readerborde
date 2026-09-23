import { describe, expect, it } from "vitest";
import { selectCurrent } from "../src/ingest/adapters/artificial-analysis";
import { latestModelComparison, latestModelComparisonSource } from "../src/lib/latest-models";

describe("latest model coverage", () => {
  it("keeps GPT-6 Sol and Luna in the official comparison chart", () => {
    expect(latestModelComparison.map((model) => model.slug)).toEqual(["gpt-6-astra", "gpt-6-sol", "gpt-6-luna"]);
    expect(latestModelComparison.find((model) => model.slug === "gpt-6-luna")).toMatchObject({ inputPrice: 0.1, outputPrice: 0.5, context: 1_050_000 });
    expect(latestModelComparisonSource.url).toMatch(/^https:\/\/developers\.openai\.com\//);
  });

  it("retains evaluated Sol and Luna even when they fall outside the top 16", () => {
    const rows = Array.from({ length: 18 }, (_, index) => ({ slug: `model-${index}`, name: `Model ${index}`, deprecated: false, modelCreatorName: "Fixture", intelligenceIndex: 100 - index }));
    rows.push({ slug: "gpt-6-sol-max", name: "GPT-6 Sol (max)", deprecated: false, modelCreatorName: "OpenAI", intelligenceIndex: 50 });
    rows.push({ slug: "gpt-6-luna", name: "GPT-6 Luna", deprecated: false, modelCreatorName: "OpenAI", intelligenceIndex: 49 });
    const selected = selectCurrent(rows);
    expect(selected.some((model) => model.slug === "gpt-6-sol-max")).toBe(true);
    expect(selected.some((model) => model.slug === "gpt-6-luna")).toBe(true);
  });
});
