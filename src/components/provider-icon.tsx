import Image from "next/image";

const icons: Record<string, string> = {
  alibaba: "alibaba",
  anthropic: "anthropic",
  deepseek: "deepseek",
  google: "google",
  kimi: "kimi",
  meta: "meta",
  mistral: "mistral",
  mistralai: "mistral",
  moonshotai: "kimi",
  openai: "openai",
  spacexai: "spacexai",
  stepfun: "stepfun",
  xai: "spacexai",
  xiaomi: "xiaomi",
  zai: "zai",
  zhipuai: "zai",
};

export function ProviderIcon({ provider }: { provider: string }) {
  const key = provider.toLowerCase().replace(/[^a-z0-9]/g, "");
  const icon = icons[key];
  if (!icon) return <span className="provider-monogram" aria-label={`${provider} 로고 대체 문자`}>{provider.slice(0, 1).toUpperCase()}</span>;
  return <span className="provider-icon"><Image src={`/providers/${icon}.svg`} width={15} height={15} alt={`${provider} 로고`} /></span>;
}
