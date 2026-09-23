export const latestModelComparison = [
  { slug: "gpt-6-astra", name: "GPT-6 Astra", role: "최고 성능", inputPrice: 10, outputPrice: 50, context: 1_050_000, color: "#8B7CFF" },
  { slug: "gpt-6-sol", name: "GPT-6 Sol", role: "성능·비용 균형", inputPrice: 2, outputPrice: 10, context: 1_050_000, color: "#52D6FF" },
  { slug: "gpt-6-luna", name: "GPT-6 Luna", role: "고효율·대량 작업", inputPrice: 0.1, outputPrice: 0.5, context: 1_050_000, color: "#36D399" },
] as const;

export const latestModelComparisonSource = {
  label: "OpenAI API 모델·가격 문서",
  url: "https://developers.openai.com/api/docs/models/compare",
  observedAt: "2026-09-23",
};
