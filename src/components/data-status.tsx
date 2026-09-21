import type { PublicData } from "@/lib/public-data";

export function DataStatus({ data }: { data: PublicData }) {
  return <div className={`data-status ${data.source}`} role="status">
    <span aria-hidden="true" />
    <b>{data.source === "database" ? "LIVE DATA" : "VERIFIED FALLBACK"}</b>
    <p>{data.source === "database" ? "오늘의 영속 스냅샷이 원자적으로 공개되었습니다." : data.notice}</p>
  </div>;
}
