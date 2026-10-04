import type { AccessPath, ResolvedModelGuide } from "./model-guide-types";
export function pricesFor(guide: ResolvedModelGuide, path: AccessPath) {
  const kind = path.kind === "api" ? "api" : path.kind === "partner" ? "external" : path.kind === "local" ? "open-weights" : "subscription";
  const candidates = guide.prices.filter((p) => p.billingType === kind);
  const shared = candidates.filter((p) => p.sourceIds.some((id) => path.sourceIds.includes(id)));
  return shared.length ? shared : candidates.length === 1 ? candidates : [];
}
