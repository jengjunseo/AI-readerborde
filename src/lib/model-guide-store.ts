import { and, eq } from "drizzle-orm";
import type { AppDb } from "@/db/client";
import { modelGuideFamilies as guideFamilyTable, modelVersionGuides as guideVersionTable, models, modelVersions, providers } from "@/db/schema";
import { modelGuideFamilies, modelVersionGuides, resolveModelGuide } from "./model-guides";
import type { ResolvedModelGuide } from "./model-guide-types";
import type { Model } from "./types";

export async function syncPublishedModelGuides(db: AppDb) {
  const identities = await db.select({
    modelVersionId: modelVersions.id,
    slug: models.slug,
    name: models.name,
    provider: providers.name,
    version: modelVersions.version,
  }).from(modelVersions)
    .innerJoin(models, eq(modelVersions.modelId, models.id))
    .innerJoin(providers, eq(models.providerId, providers.id))
    .where(and(eq(modelVersions.isCurrent, true), eq(models.lifecycle, "published")));

  let synced = 0;
  for (const identity of identities) {
    const version = modelVersionGuides[identity.slug];
    if (!version) continue;
    const family = modelGuideFamilies[version.familyKey];
    const guide = resolveModelGuide({ slug: identity.slug, name: identity.name, provider: identity.provider, version: identity.version });
    const now = new Date();
    await db.insert(guideFamilyTable).values({ familyKey: family.key, officialName: family.officialName, providerName: family.provider, content: family, sources: family.sources, status: "published", lastVerifiedAt: version.lastVerifiedAt, updatedAt: now }).onConflictDoUpdate({ target: guideFamilyTable.familyKey, set: { officialName: family.officialName, providerName: family.provider, content: family, sources: family.sources, status: "published", lastVerifiedAt: version.lastVerifiedAt, updatedAt: now } });
    await db.insert(guideVersionTable).values({ modelVersionId: identity.modelVersionId, familyKey: family.key, content: guide, sources: guide.sources, status: version.status, lastVerifiedAt: version.lastVerifiedAt, publishedAt: version.status === "published" ? now : null, updatedAt: now }).onConflictDoUpdate({ target: guideVersionTable.modelVersionId, set: { familyKey: family.key, content: guide, sources: guide.sources, status: version.status, lastVerifiedAt: version.lastVerifiedAt, publishedAt: version.status === "published" ? now : null, updatedAt: now } });
    synced += 1;
  }
  return synced;
}

export async function loadPublishedModelGuide(db: AppDb, model: Model): Promise<ResolvedModelGuide | undefined> {
  const row = (await db.select({ content: guideVersionTable.content }).from(guideVersionTable)
    .innerJoin(modelVersions, eq(guideVersionTable.modelVersionId, modelVersions.id))
    .innerJoin(models, eq(modelVersions.modelId, models.id))
    .where(and(eq(models.slug, model.slug), eq(modelVersions.version, model.version), eq(guideVersionTable.status, "published")))
    .limit(1))[0];
  return row?.content as ResolvedModelGuide | undefined;
}
