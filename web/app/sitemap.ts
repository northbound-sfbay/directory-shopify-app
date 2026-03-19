import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.findshopifyapps.com";

  return [
    { url: base, priority: 1.0, changeFrequency: "daily" },
    { url: `${base}/apps`, priority: 0.9, changeFrequency: "daily" },
    { url: `${base}/categories`, priority: 0.8, changeFrequency: "weekly" },
  ];
}
