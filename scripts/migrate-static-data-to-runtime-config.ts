import navigationData from "@/data/navigation.json";
import socialLinksData from "@/data/socialLinks.json";
import friendLinksData from "@/data/friendLinks.json";
import seoData from "@/data/seo.json";
import { getDbClient } from "@/server/db/client";

type RuntimeSeedValue = string | number;

/**
 * 写入运行时配置项。
 *
 * @param key 配置键
 * @param value 配置值
 */
async function upsertConfigValue(key: string, value: RuntimeSeedValue): Promise<void> {
  const db = getDbClient();
  await db.systemConfig.upsert({
    where: { key },
    update: { value: value as never },
    create: { key, value: value as never },
  });
}

/**
 * 构建静态数据到运行时配置的映射。
 *
 * @returns 待迁移配置映射
 */
function buildMigrationPayload(): Record<string, RuntimeSeedValue> {
  const seoRecord = (seoData && typeof seoData === "object" ? seoData : {}) as Record<string, unknown>;
  const sitemapRecord = (seoRecord.sitemap && typeof seoRecord.sitemap === "object"
    ? seoRecord.sitemap
    : {}) as Record<string, unknown>;

  return {
    NEXT_PUBLIC_NAVIGATION_ITEMS: JSON.stringify(navigationData),
    NEXT_PUBLIC_PROFILE_SOCIAL_LINKS: JSON.stringify(socialLinksData),
    NEXT_PUBLIC_FRIEND_LINKS: JSON.stringify(friendLinksData),
    NEXT_PUBLIC_SEO_DEFAULT_OG_IMAGE: typeof seoRecord.defaultOgImage === "string" ? seoRecord.defaultOgImage : "",
    NEXT_PUBLIC_SEO_TWITTER_HANDLE: typeof seoRecord.twitterHandle === "string" ? seoRecord.twitterHandle : "",
    NEXT_PUBLIC_SEO_TWITTER_SITE: typeof seoRecord.twitterSite === "string" ? seoRecord.twitterSite : "",
    NEXT_PUBLIC_SEO_SITEMAP_CHANGE_FREQUENCY:
      typeof sitemapRecord.changeFrequency === "string" ? sitemapRecord.changeFrequency : "weekly",
    NEXT_PUBLIC_SEO_SITEMAP_PRIORITY:
      typeof sitemapRecord.priority === "number" ? sitemapRecord.priority : 0.7,
  };
}

/**
 * 执行静态数据迁移任务。
 */
async function runMigration(): Promise<void> {
  const payload = buildMigrationPayload();
  const entries = Object.entries(payload);
  for (const [key, value] of entries) {
    await upsertConfigValue(key, value);
    console.log(`[migrate:data:runtime] updated ${key}`);
  }
}

runMigration()
  .then(() => {
    console.log("[migrate:data:runtime] done");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[migrate:data:runtime] failed", error);
    process.exit(1);
  });
