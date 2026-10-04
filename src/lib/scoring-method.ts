const normalize = (raw: number, [floor, ceiling]: readonly [number, number]) => Math.min(100, Math.max(0, (raw - floor) / (ceiling - floor) * 100));

// Shared by the v2.1 pipeline and its public explanation. Never rewrite old snapshots.
export const methodVersion = "v2.1";
export const metricAnchors: Record<string, readonly [number, number]> = {
  gpqa: [0, 100], hle: [0, 100], terminal_bench: [0, 100], scicode: [0, 100], swe_bench: [0, 100],
  gdpval: [0, 100], analyst_agent: [0, 100], apex_agents: [0, 100], itbench_sre: [0, 100],
  long_context: [0, 100], multimodal: [0, 100], korean: [0, 100], output_speed: [20, 400],
};
export const axisDefinitions = {
  reasoning: { label: "추론·문제 해결", weight: .25, metrics: ["gpqa", "hle"] },
  coding: { label: "코딩", weight: .25, metrics: ["terminal_bench", "scicode", "swe_bench"] },
  agentic: { label: "업무·에이전트", weight: .15, metrics: ["gdpval", "analyst_agent", "apex_agents", "itbench_sre"] },
  context: { label: "긴 문서·이미지 이해", weight: .10, metrics: ["long_context", "multimodal"] },
  korean: { label: "한국어", weight: .10, metrics: ["korean"] },
  value: { label: "작업 비용", weight: .10, metrics: ["cost_per_task"] },
  speed: { label: "출력 속도", weight: .05, metrics: ["output_speed"] },
} as const;
export function normalizedValue(metricKey: string, raw: number) {
  if (metricKey === "cost_per_task") return Math.max(0, Math.min(100, 100 - normalize(raw, [0, 8])));
  const anchor = metricAnchors[metricKey];
  return anchor ? normalize(raw, anchor) : undefined;
}
export function missingMetrics(axis: string, present: string[]) {
  const definition = axisDefinitions[axis as keyof typeof axisDefinitions];
  return definition ? definition.metrics.filter((key) => !present.includes(key)) : [];
}
