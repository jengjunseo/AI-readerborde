import type { Board, BoardSlug } from "./types";
export const boardOrder: BoardSlug[] = ["overall", "coding", "agentic", "value", "speed", "korean"];
export const boardMeta: Record<BoardSlug, Pick<Board, "label" | "description" | "kind">> = {
  overall: { label: "종합", description: "능력·가치·속도를 결측치 0점 처리 없이 가중 결합합니다.", kind: "score" },
  coding: { label: "코딩", description: "Terminal-Bench와 SciCode 등 코딩 실행 근거를 결합합니다.", kind: "score" },
  agentic: { label: "업무·에이전트", description: "GDPval-AA와 도구 사용·업무 수행 평가를 결합합니다.", kind: "score" },
  value: { label: "가성비", description: "실제 Intelligence Index 작업당 비용을 보수적으로 역정규화한 지수입니다.", kind: "score" },
  speed: { label: "속도", description: "관측된 중앙 출력 속도를 고정 기준으로 정규화합니다.", kind: "score" },
  korean: { label: "한국어", description: "검증 가능한 한국어 평가가 있는 모델만 순위를 제공합니다.", kind: "score" },
};
