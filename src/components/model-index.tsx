"use client";
import Link from "next/link";
import { useState } from "react";
import { displayName, evaluationSetting, contextText } from "@/lib/presentation";
import type { Model } from "@/lib/types";
import { ProviderIcon } from "./provider-icon";
export function ModelIndex({ models }: { models: Model[] }) {
  const [query,setQuery] = useState("");
  const filtered = models.filter((m) => `${m.name} ${m.provider}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <section className="model-index"><label className="search-field"><span>모델·개발사 검색</span><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="모델 또는 개발사 이름" /></label><p className="detail-meta" aria-live="polite">{filtered.length}개 모델</p>
    <ul>{filtered.map((m) => <li key={m.slug}><Link href={`/models/${m.slug}`}><ProviderIcon provider={m.provider} /><span><b>{displayName(m.name)}</b><small>{m.provider} · 평가 컨텍스트 {contextText(m.context)}{evaluationSetting(m.name) ? ` · ${evaluationSetting(m.name)}` : ""}</small></span><span aria-hidden="true">→</span></Link></li>)}</ul>{!filtered.length && <p>검색 결과가 없습니다.</p>}
  </section>;
}
