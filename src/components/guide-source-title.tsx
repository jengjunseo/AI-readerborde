import type { GuideSource } from "@/lib/model-guide-types";

export function GuideSourceTitle({ label, sourceIds, sources, href }: {
  label: string;
  sourceIds?: string[];
  sources?: GuideSource[];
  href?: string;
}) {
  const url = href ?? sourceIds?.map((id) => sources?.find((source) => source.id === id)?.url).find(Boolean);
  return url ? <a className="guide-source-title" href={url} target="_blank" rel="noreferrer" aria-label={`${label} · 원문 열기 (새 탭)`}>{label}</a> : <span>{label}</span>;
}
