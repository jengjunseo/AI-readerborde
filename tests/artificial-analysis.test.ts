import { describe, expect, it } from "vitest";
import { artificialAnalysisAdapter, parseIndexVersion, parseModels } from "../src/ingest/adapters/artificial-analysis";
import { vi } from "vitest";

// Synthetic transport fixtures, not claimed as live model observations.
const model = {
  slug: "fixture-max", name: 'Fixture \\"quoted\\" ],"messages" [model]',
  modelCreatorName: "Fixture", intelligenceIndex: 55,
  gpqa: .9, scicode: .6, intelligenceIndexCostPerTask: .4,
};
const flight = (chunks: string[]) => chunks.map((chunk) =>
  `<script>self.__next_f.push(${JSON.stringify([1, chunk])})</script>`).join("");

describe("Artificial Analysis source transport", () => {
  it("maps nested ratio scores without treating Elo or newer benchmarks as old percentages", () => {
    const row = parseModels(flight([JSON.stringify({ initialModels: [{
      slug: "nested", name: "Nested", modelCreatorName: "Fixture", intelligenceIndex: 60,
      scores: { "humanitys-last-exam": .7, "hle-diamond": .9, "terminalbench-4-0": .6, "scicode": .5, "gdpval-aa-normalized": 1831.33, "aa-briefcase": 1784.66, "aa-analyst-agent": .4, "itbench-aa": .3 },
      outputSpeed: 97, timeToFirstToken: 2, timeToFirstAnswerToken: 200, intelligenceIndexTimePerTask: 2800,
    }] })]))[0];
    expect(row).toMatchObject({ hle: .7, terminalBench40: .6, scicode: .5, analystAgent: .4, itbenchSre: .3, medianOutputTokensPerSecond: 97, medianTimeToFirstTokenSeconds: 2 });
    expect(row.gdpvalNormalized).toBeUndefined();
  });

  it("uses the source's current index version and does not invent missing benchmark versions", async () => {
    const html = flight([JSON.stringify({ initialModels: Array.from({ length: 10 }, (_, i) => ({
      slug: `nested-${i}`, name: `Nested ${i}`, modelCreatorName: "Fixture", intelligenceIndex: 60-i,
      scores: { "humanitys-last-exam": .7, "terminalbench-4-0": .6 },
      outputSpeed: 97, intelligenceIndexCostPerTask: 2,
    })), evaluations: { intelligenceIndex: { slug: "artificial-analysis-intelligence-index", name: "Artificial Analysis Intelligence Index v5.0.1" } } })]);
    expect(parseIndexVersion(html)).toBe("5.0.1");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(html)));
    try {
      const result = await artificialAnalysisAdapter.fetch();
      const metrics = result.records.filter((record) => record.kind === "metric");
      expect(metrics.find((record) => record.metricKey === "cost_per_task")?.benchmarkVersion).toBe("5.0.1");
      expect(metrics.find((record) => record.metricKey === "hle")).toMatchObject({ value: 70, unit: "%" });
      expect(metrics.find((record) => record.metricKey === "hle")?.benchmarkVersion).toBeUndefined();
      expect(metrics.find((record) => record.metricKey === "terminal_bench")?.benchmarkVersion).toBe("4.0");
    } finally { vi.unstubAllGlobals(); }
  });

  it.each(["models", "initialModels"])("reads %s without relying on a following messages field", (key) => {
    const payload = `20:${JSON.stringify({ [key]: [model], unrelated: ["tail"] })}`;
    expect(parseModels(flight([payload]))[0]).toMatchObject(model);
  });

  it("reassembles split property names and escaped strings across Flight chunks", () => {
    const payload = JSON.stringify({ initialModels: [model] });
    expect(parseModels(flight([payload.slice(0, 8), payload.slice(8, 90), payload.slice(90)]))[0]).toMatchObject(model);
  });

  it("ignores unrelated pickers and script markup rather than executing it", () => {
    const payload = JSON.stringify({ models: [{ slug: "picker" }], initialModels: [model] });
    expect(parseModels('<script>throw new Error("must not execute")</script>' + flight([payload]))).toHaveLength(1);
  });

  it("rejects incomplete transport instead of publishing a partial list", () => {
    const payload = JSON.stringify({ initialModels: [model] });
    expect(() => parseModels(flight([payload.slice(0, -2)]))).toThrow(/incomplete/);
  });

  it("rejects malformed evaluation identities", () => {
    expect(() => parseModels(flight([JSON.stringify({ initialModels: [{ intelligenceIndex: 55 }] })]))).toThrow();
  });
});
