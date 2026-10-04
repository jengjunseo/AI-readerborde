import type { PublicData } from "@/lib/public-data";

export function DataStatus({ data }: { data: PublicData }) {
  return <div className={`data-status ${data.source}`} role="status">
    <span aria-hidden="true" />
    <b>{data.source === "database" ? data.health.stale ? "이전 정상 데이터" : "일일 갱신" : "기준 자료"}</b>
    <p>{data.source === "database" ? `공개 순위 생성 ${data.health.lastCronSuccessAt ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(data.health.lastCronSuccessAt)) : data.snapshot.date} KST · 평가 항목 확보율 ${(data.health.sourceCoverage * 100).toFixed(0)}% (공식 소개 검증률과 다름)` : data.notice}</p>
  </div>;
}
