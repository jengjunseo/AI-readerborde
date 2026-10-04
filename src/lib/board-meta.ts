import type { Board, BoardSlug } from "./types";
export const boardOrder: BoardSlug[] = ["overall", "coding", "agentic", "value", "speed", "korean"];
export const boardMeta: Record<BoardSlug, Pick<Board, "label" | "description" | "kind">> = {
  overall: { label: "종합", description: "능력 평가에 작업 비용과 출력 속도를 더한 이 사이트의 종합 지수입니다. 지능·정확도만의 순위는 아닙니다.", kind: "score" },
  coding: { label: "코딩", description: "Terminal-Bench와 SciCode 등 코딩 실행 근거를 결합합니다.", kind: "score" },
  agentic: { label: "업무·에이전트", description: "GDPval-AA와 도구 사용·업무 수행 평가를 결합합니다.", kind: "score" },
  value: { label: "작업 비용", description: "Artificial Analysis 평가 작업당 비용(USD)입니다. 낮을수록 앞섭니다. 실제 업무 비용·성공 확률·구독료와는 다릅니다.", kind: "score" },
  speed: { label: "속도", description: "관측된 중앙 출력 속도를 고정 기준으로 정규화합니다.", kind: "score" },
  korean: { label: "한국어", description: "한국어 평가 자료가 있는 모델만 표시합니다.", kind: "score" },
};

export function boardMetaFor(version: string): typeof boardMeta {
  if (!version.startsWith("v1")) return boardMeta;
  return {
    ...boardMeta,
    overall: { ...boardMeta.overall, description: "v1 기준 자료: GPQA 40%·SWE-bench 40%·AIME 20%의 능력 평가를 합산합니다. 비용과 속도는 포함하지 않습니다." },
    coding: { ...boardMeta.coding, description: "v1 기준 자료: SWE-bench Verified를 고정 기준 20–85%로 0–100 환산합니다." },
    value: { ...boardMeta.value, label: "API 가격 (v1)", description: "v1 기준 자료: 입력 75%·출력 25%로 섞은 API 요금(USD / 100만 토큰)입니다. 현재 AA 평가 작업 비용과 비교할 수 없습니다." },
  };
}
