import { MetadataRoute } from "next";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.findshopifyapps.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, priority: 1.0, changeFrequency: "daily" },
    { url: `${base}/apps`, priority: 0.9, changeFrequency: "daily" },
    { url: `${base}/categories`, priority: 0.8, changeFrequency: "weekly" },
  ];

  // Fetch all app slugs
  const { data: apps } = await db
    .from("apps")
    .select("slug")
    .eq("status", "ok");

  const appPages: MetadataRoute.Sitemap = (apps ?? []).map((app) => ({
    url: `${base}/apps/${app.slug}`,
    priority: 0.7,
    changeFrequency: "weekly" as const,
  }));

  return [...staticPages, ...appPages];
}
