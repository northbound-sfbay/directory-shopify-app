import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = "https://www.findshopifyapps.com";

  const { data: apps } = await db
    .from("apps")
    .select("slug")
    .eq("status", "ok");

  const appUrls = (apps ?? [])
    .map((app) => `<url><loc>${base}/apps/${app.slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${base}/apps</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${base}/categories</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  ${appUrls}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
