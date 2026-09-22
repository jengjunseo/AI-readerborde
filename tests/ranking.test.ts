import { describe, expect, it } from "vitest";
import { curatedModels } from "../src/lib/curated-data";
import { blendedPrice, buildSnapshot, normalize } from "../src/lib/ranking";
describe("ranking method v1", () => {
  it("uses fixed anchors and clamps extreme values", () => { expect(normalize(20, [30, 90])).toBe(0); expect(normalize(60, [30, 90])).toBe(50); expect(normalize(100, [30, 90])).toBe(100); });
  it("makes value a deterministic inverse of the 3:1 input/output price", () => { const snapshot = buildSnapshot(curatedModels, "2026-09-18"); const entry = snapshot.boards.value.entries[0]; expect(entry.model.slug).toBe("qwen3-235b"); expect(entry.price).toBe(blendedPrice(curatedModels.find((model) => model.slug === "qwen3-235b")!)); });
  it("is idempotent for identical curated input", () => { const first = buildSnapshot(curatedModels, "2026-09-18"); const second = buildSnapshot(curatedModels, "2026-09-18"); expect(second.inputHash).toBe(first.inputHash); expect(second.boards.overall.entries.map((entry) => entry.model.slug)).toEqual(first.boards.overall.entries.map((entry) => entry.model.slug)); });
});
