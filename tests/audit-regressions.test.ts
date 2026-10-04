import { describe, expect, it } from "vitest";
import { boardSlug, contextText, displayName, leaderboardUrl, metricText, metricHeading, safeReturn, toggleComparison } from "../src/lib/presentation";
import { axisDefinitions, missingMetrics, normalizedValue } from "../src/lib/scoring-method";
import { resolveModelGuide } from "../src/lib/model-guides";
import type { RankedEntry } from "../src/lib/types";
import { pricesFor } from "../src/lib/guide-presentation";
import { boardMetaFor } from "../src/lib/board-meta";
describe("audit regressions", () => {
  it("does not silently replace either selected model on a third selection", () => {
    expect(toggleComparison(["a","b"],"c")).toEqual({selected:["a","b"],error:expect.any(String)});
    expect(toggleComparison(["a","b"],"a").selected).toEqual(["b"]);
  });
  it("preserves board and search in safe return URLs", () => {
    expect(boardSlug("bad")).toBe("overall");
    expect(leaderboardUrl("coding","Claude")).toBe("/?board=coding&q=Claude");
    expect(safeReturn("/?board=coding&q=Claude")).toBe("/?board=coding&q=Claude");
    for(const unsafe of ["//evil.example","https://evil.example","/models/abc","/\\evil.example"]) expect(safeReturn(unsafe)).toBe("/");
  });
  it("separates product names and evaluation settings and formats context consistently", () => {
    expect(displayName("Claude Fable 5.1 (Adaptive Reasoning, Max Effort, Default Fallback)")).toBe("Claude Fable 5.1");
    expect(contextText(1048576)).toBe("104.86만 토큰");
  });
  it("shows raw evaluation cost, not a cost score or substituted token price", () => {
    const entry = { value:95, price:.4, speed:100 } as RankedEntry;
    expect(metricText(entry,"value")).toBe("$0.40");
    expect(metricText({value:95} as RankedEntry,"value")).toBe("자료 없음");
    expect(metricText(entry,"value","v1")).toBe("$0.40"); // v1 price is the explicitly labeled blended API rate
    expect(metricHeading("value","v1")).toBe("API 요금 / 100만 토큰");
    expect(boardMetaFor("v1").overall.description).toContain("비용과 속도는 포함하지 않습니다");
    expect(boardMetaFor("v1").value.label).toBe("API 가격 (v1)");
    expect(boardMetaFor("v2.1").value.label).toBe("작업 비용");
    expect(metricText(entry,"speed")).toBe("100 토큰/초");
  });
  it("matches v2.1 fixed anchors and missing-data examples", () => {
    expect(Object.values(axisDefinitions).reduce((s,a)=>s+a.weight,0)).toBeCloseTo(1);
    expect(normalizedValue("cost_per_task",4)).toBe(50);
    expect(normalizedValue("cost_per_task",9)).toBe(0);
    expect(normalizedValue("output_speed",210)).toBe(50);
    expect(normalizedValue("output_speed",10)).toBe(0);
    expect(missingMetrics("coding",["scicode"])).toEqual(["terminal_bench","swe_bench"]);
    expect((80*.25+60*.25+50*.15+50*.10+50*.05)/.8).toBe(62.5);
  });
  it("does not advertise Opus 5.5 as a free Claude model", () => {
    const guide=resolveModelGuide({slug:"claude-opus-5-5",name:"Claude Opus 5.5",provider:"Anthropic",version:"max"});
    expect(guide.access.find((a)=>a.kind==="web")?.freeAccess).toBe("no");
    expect(guide.lastVerifiedAt).toBe("2026-10-05");
    expect(pricesFor(guide,guide.access[0]).every((p)=>p.billingType==="subscription")).toBe(true);
    expect(pricesFor(guide,guide.access[1]).every((p)=>p.billingType==="api")).toBe(true);
  });
});
