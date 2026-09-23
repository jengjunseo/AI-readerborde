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
  "claude-fable-5-1", "claude-opus-5", "grok-4-6", "gpt-6-sol", "gpt-6-luna", "kimi-k3", "step-5", "gemini-3-8-flash", "qwen3-8-2-4t-a95b", "qwen3-8-max", "grok-4-7",
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
      expect(guide.sources.every((item) => item.url.startsWith("https://") && item.verifiedAt === "2026-09-23")).toBe(true);
      const knownSourceIds = new Set(guide.sources.map((item) => item.id));
      const refs = [
        ...guide.useCases.flatMap((item) => item.sourceIds), ...guide.strengths.flatMap((item) => item.sourceIds), ...guide.cautions.flatMap((item) => item.sourceIds),
        ...guide.access.flatMap((item) => item.sourceIds), ...guide.prices.flatMap((item) => item.sourceIds), ...(guide.openWeights?.sourceIds ?? []),
      ];
      expect(refs.every((id) => knownSourceIds.has(id)), `${slug} has a dangling source reference`).toBe(true);
    }
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
    const provider = (await db.insert(schema.providers).values({ slug: "openai", name: "OpenAI" }).returning())[0];
    const identity = (await db.insert(schema.models).values({ providerId: provider.id, slug: "gpt-6-astra", name: "GPT-6 Astra (max)", lifecycle: "published", adminApproved: true }).returning())[0];
    await db.insert(schema.modelVersions).values({ modelId: identity.id, version: "gpt-6-astra", contextLength: "1050000", isCurrent: true });
    expect(await syncPublishedModelGuides(db)).toBe(1);
    expect(await syncPublishedModelGuides(db)).toBe(1);
    expect(await db.select().from(schema.modelGuideFamilies)).toHaveLength(1);
    const rows = await db.select().from(schema.modelVersionGuides);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("published");
    expect((rows[0]?.content as { slug?: string }).slug).toBe("gpt-6-astra");
    await client.close();
  });
});
