export type GuideStatus = "pending" | "verified" | "published";
export type SourceKind = "release" | "documentation" | "pricing" | "access" | "license" | "runtime";

export type GuideSource = {
  id: string;
  label: string;
  url: string;
  kind: SourceKind;
  verifiedAt: string;
};

export type AccessPath = {
  kind: "web" | "app" | "api" | "partner" | "local";
  label: string;
  platform: string;
  freeAccess: "yes" | "limited" | "no" | "unknown";
  requirements: string;
  technicalLevel: "쉬움" | "보통" | "개발자용";
  steps: string[];
  url: string;
  sourceIds: string[];
};

export type PriceItem = {
  label: string;
  billingType: "subscription" | "api" | "external" | "open-weights";
  price: string;
  unit: string;
  note?: string;
  observedAt: string;
  sourceIds: string[];
};

export type OpenWeightsGuide = {
  license: string;
  licenseUrl: string;
  downloadUrl: string;
  meaning: string;
  parameterScale: string;
  precisions: string;
  estimatedWeightMemory: string;
  runtimeMemoryNote: string;
  cpuGpuNote: string;
  tools: { name: string; url: string }[];
  steps: string[];
  sourceIds: string[];
};

export type ModelFamilyGuide = {
  key: string;
  officialName: string;
  provider: string;
  introduction: string;
  useCases: { title: string; description: string; sourceIds: string[] }[];
  strengths: { title: string; description: string; sourceIds: string[] }[];
  cautions: { title: string; description: string; sourceIds: string[] }[];
  glossaryTerms: string[];
  sources: GuideSource[];
};

export type ModelVersionGuide = {
  slug: string;
  familyKey: string;
  officialName: string;
  contextTokens?: number;
  releaseDate?: string;
  modelType: string;
  summary: string;
  configurationNote?: string;
  capabilities: string[];
  access: AccessPath[];
  prices: PriceItem[];
  openWeights?: OpenWeightsGuide;
  glossaryTerms: string[];
  sources: GuideSource[];
  status: GuideStatus;
  lastVerifiedAt: string;
};

export type ResolvedModelGuide = ModelVersionGuide & {
  provider: string;
  introduction: string;
  useCases: ModelFamilyGuide["useCases"];
  strengths: ModelFamilyGuide["strengths"];
  cautions: ModelFamilyGuide["cautions"];
};
