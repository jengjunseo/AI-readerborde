import { describe, expect, it } from "vitest";
import { parseModels } from "../src/ingest/adapters/artificial-analysis";

// Synthetic transport fixtures, not claimed as live model observations.
const model = {
  slug: "fixture-max", name: 'Fixture \\"quoted\\" ],"messages" [model]',
  modelCreatorName: "Fixture", intelligenceIndex: 55,
  gpqa: .9, scicode: .6, intelligenceIndexCostPerTask: .4,
};
const flight = (chunks: string[]) => chunks.map((chunk) =>
  `<script>self.__next_f.push(${JSON.stringify([1, chunk])})</script>`).join("");

describe("Artificial Analysis source transport", () => {
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
