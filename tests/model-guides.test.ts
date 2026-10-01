import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import { describe, expect, it } from "vitest";
import * as schema from "../src/db/schema";
import { glossary } from "../src/lib/glossary";
import { syncPublishedModelGuides } from "../src/lib/model-guide-store";
import { publishedGuideSlugs, resolveModelGuide } from "../src/lib/model-guides";

const productionSlugs = [
  "muse-spark-1-3", "gpt-6-astra", "claude-opus-5-5", "gpt-5-6-sol", "glm-5-3", "glm-5-3-flash", "gpt-5-6-terra", "mimo-v2-6-pro",
  "claude-fable-5-1", "claude-opus-5", "grok-4-6", "gpt-6-sol", "gpt-6-luna", "kimi-k3", "step-5", "gemini-3-8-flash", "qwen3-8-2-4t-a95b", "qwen3-8-max", "grok-4-7", "gpt-6-1-sol", "claude-sonnet-5-5",
];

const model = (slug: string) => ({ slug, name: slug, provider: "Test Provider", version: slug });

describe("beginner model encyclopedia", () => {
  it("covers every public production model with traceable, reviewed content", () => {
    expect([...publishedGuideSlugs].sort()).toEqual([...productionSlugs].sort());
    for (const slug of productionSlugs) {
      const guide = resolveModelGuide(model(slug));
      expect(guide.status).toBe("published");
      expect(guide.introduction.length).toBeGreaterThan(30);
      expect(guide.useCases.length).toBeGreaterThan(0);
      expect(guide.access.length).toBeGreaterThan(0);
      expect(guide.prices.length).toBeGreaterThan(0);
      expect(guide.sources.length).toBeGreaterThan(0);
      expect(guide.sources.every((item) => item.url.startsWith("https://") && /^\d{4}-\d{2}-\d{2}$/.test(item.verifiedAt) && item.verifiedAt <= guide.lastVerifiedAt)).toBe(true);
      const knownSourceIds = new Set(guide.sources.map((item) => item.id));
      const refs = [
        ...guide.useCases.flatMap((item) => item.sourceIds), ...guide.strengths.flatMap((item) => item.sourceIds), ...guide.cautions.flatMap((item) => item.sourceIds),
        ...guide.access.flatMap((item) => item.sourceIds), ...guide.prices.flatMap((item) => item.sourceIds), ...(guide.openWeights?.sourceIds ?? []),
      ];
      expect(refs.every((id) => knownSourceIds.has(id)), `${slug} has a dangling source reference`).toBe(true);
    }
  });

  it("distinguishes the latest versions, verified prices and consumer access", () => {
    const sol = resolveModelGuide(model("gpt-6-1-sol"));
    const oldSol = resolveModelGuide(model("gpt-6-sol"));
    expect(sol.officialName).toBe("GPT-6.1 Sol");
    expect(sol.releaseDate).toBe("2026-09-29");
    expect(sol.access.find((item) => item.kind === "app")?.requirements).toContain("일반 Chat에서는 선택할 수 없습니다");
    expect(sol.prices.find((item) => item.billingType === "api")?.price).toBe("입력 $2 · 캐시 입력 $0.10 · 출력 $10");
    expect(oldSol.prices[0].price).toContain("캐시 입력 $0.20");
    expect(oldSol.lastVerifiedAt).toBe("2026-09-23");
    const sonnet = resolveModelGuide(model("claude-sonnet-5-5"));
    expect(sonnet.releaseDate).toBe("2026-09-28");
    expect(sonnet.access.find((item) => item.kind === "web")?.freeAccess).toBe("limited");
    expect(sonnet.prices.find((item) => item.billingType === "api")?.price).toBe("입력 $2 · 캐시 읽기 $0.20 · 출력 $10");
    expect(sonnet.openWeights).toBeUndefined();
    expect([sol, sonnet].every((guide) => guide.lastVerifiedAt === "2026-10-01" && guide.sources.every((item) => item.verifiedAt === "2026-10-01"))).toBe(true);
  });

  it("shows open-weight requirements only for models with official downloads", () => {
    const expected = ["glm-5-3", "glm-5-3-flash", "mimo-v2-6-pro", "kimi-k3", "qwen3-8-2-4t-a95b"];
    const actual = productionSlugs.filter((slug) => resolveModelGuide(model(slug)).openWeights);
    expect(actual.sort()).toEqual(expected.sort());
    for (const slug of actual) {
      const open = resolveModelGuide(model(slug)).openWeights!;
      expect(open.licenseUrl).toMatch(/^https:\/\//);
      expect(open.downloadUrl).toMatch(/^https:\/\//);
      expect(`${open.estimatedWeightMemory} ${open.runtimeMemoryNote}`).toContain("최소 VRAM");
      expect(open.steps.length).toBeGreaterThan(1);
    }
  });

  it("never invents access or pricing for an unknown newly discovered model", () => {
    const guide = resolveModelGuide({ slug: "new-unverified", name: "New Unverified", provider: "Unknown Lab", version: "preview" });
    expect(guide.status).toBe("pending");
    expect(guide.access).toEqual([]);
    expect(guide.prices).toEqual([]);
    expect(guide.openWeights).toBeUndefined();
    expect(guide.cautions[0]?.title).toBe("정보 확인 중");
  });

  it("keeps the shared glossary complete and mobile-readable without hover state", () => {
    for (const term of ["프런티어 모델", "오픈 웨이트", "오픈 소스", "API", "토큰", "컨텍스트 윈도", "파라미터", "양자화", "GPU 및 VRAM", "추론", "멀티모달", "에이전트", "벤치마크", "환각"]) {
      expect(glossary[term as keyof typeof glossary].length).toBeGreaterThan(20);
    }
  });

  it("persists family and version content separately and updates idempotently", async () => {
    const client = new PGlite();
    const pgliteDb = drizzle({ client, schema });
    await migrate(pgliteDb, { migrationsFolder: "drizzle" });
    const db = pgliteDb as unknown as NeonDatabase<typeof schema>;
    const provider = (await db.insert(schema.providers).values({ slug: "fixture", name: "Fixture Provider" }).returning())[0];
    for (const slug of ["gpt-6-astra", "gpt-6-1-sol", "claude-sonnet-5-5"]) {
      const identity = (await db.insert(schema.models).values({ providerId: provider.id, slug, name: slug, lifecycle: "published", adminApproved: true }).returning())[0];
      await db.insert(schema.modelVersions).values({ modelId: identity.id, version: slug, contextLength: "1050000", isCurrent: true });
    }
    expect(await syncPublishedModelGuides(db)).toBe(3);
    expect(await syncPublishedModelGuides(db)).toBe(3);
    expect(await db.select().from(schema.modelGuideFamilies)).toHaveLength(3);
    const rows = await db.select().from(schema.modelVersionGuides);
    expect(rows).toHaveLength(3);
    expect(rows.every((row) => row.status === "published")).toBe(true);
    for (const slug of ["gpt-6-1-sol", "claude-sonnet-5-5"]) {
      const row = rows.find((item) => (item.content as { slug?: string }).slug === slug);
      expect(row?.lastVerifiedAt).toBe("2026-10-01");
      expect((row?.content as { prices?: unknown[] }).prices).toHaveLength(2);
    }
    await client.close();
  });
});
