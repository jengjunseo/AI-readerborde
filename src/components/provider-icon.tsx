import Image from "next/image";

const icons = ["anthropic", "google", "meta", "xiaomi", "alibaba", "deepseek", "spacexai"] as const;

export function ProviderIcon({ provider }: { provider: string }) {
  const key = provider.toLowerCase().replace(/[^a-z0-9]/g, "");
  const icon = icons.find((name) => key.includes(name) || (name === "spacexai" && key === "xai"));
  if (!icon) return <span className="provider-monogram" aria-label={`${provider} 로고 대체 문자`}>{provider.slice(0, 1).toUpperCase()}</span>;
  return <span className="provider-icon"><Image src={`/providers/${icon}.svg`} width={15} height={15} alt={`${provider} 로고`} /></span>;
}
