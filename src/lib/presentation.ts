import { boardOrder } from "./board-meta";
import type { BoardSlug, RankedEntry } from "./types";

export function boardSlug(value?: string | null): BoardSlug {
  return boardOrder.includes(value as BoardSlug) ? value as BoardSlug : "overall";
}
export const displayName = (name: string) => name.replace(/\s*\([^)]*\)\s*$/, "").trim();
export const evaluationSetting = (name: string) => name.match(/\(([^)]*)\)\s*$/)?.[1];
export const contextText = (tokens: number) => tokens > 0 ? `${(tokens / 10000).toLocaleString("ko-KR", { maximumFractionDigits: 2 })}만 토큰` : "확인 중";
export const metricHeading = (slug: BoardSlug, version = "v2.1") => slug === "value" ? version.startsWith("v1") ? "API 요금 / 100만 토큰" : "평가 작업당 비용" : slug === "speed" ? "출력 속도" : "점수 / 100";
export function metricText(entry: RankedEntry, slug: BoardSlug, version = "v2.1") {
  if (slug === "value") return (version === "v2.1" || version.startsWith("v1")) && entry.price !== undefined ? `$${entry.price.toFixed(2)}` : "자료 없음";
  if (slug === "speed") return entry.speed === undefined ? "자료 없음" : `${Math.round(entry.speed)} 토큰/초`;
  return entry.value.toFixed(1);
}
export function toggleComparison(current: string[], slug: string): { selected: string[]; error?: string } {
  if (current.includes(slug)) return { selected: current.filter((item) => item !== slug) };
  if (current.length === 2) return { selected: current, error: "두 모델까지 비교할 수 있습니다. 선택한 모델을 먼저 해제하세요." };
  return { selected: [...current, slug] };
}
export function leaderboardUrl(board: BoardSlug, query = "") {
  const params = new URLSearchParams();
  if (board !== "overall") params.set("board", board);
  if (query) params.set("q", query);
  return `/${params.size ? `?${params}` : ""}`;
}
// Only our leaderboard can be a return destination, never an arbitrary redirect.
export function safeReturn(value?: string) {
  if (!value || !/^\/(?:\?[^#]*)?(?:#.*)?$/.test(value)) return "/";
  return value;
}
