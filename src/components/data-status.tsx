import type { PublicData } from "@/lib/public-data";

export function DataStatus({ data }: { data: PublicData }) {
  return <div className={`data-status ${data.source}`} role="status">
    <span aria-hidden="true" />
    <b>{data.source === "database" ? data.health.stale ? "STALE" : "LIVE" : "FALLBACK"}</b>
    <p>{data.source === "database" ? `마지막 정상 갱신 ${data.health.lastCronSuccessAt ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(data.health.lastCronSuccessAt)) : data.snapshot.date} · 소스 커버리지 ${(data.health.sourceCoverage * 100).toFixed(0)}%` : data.notice}</p>
  </div>;
}
