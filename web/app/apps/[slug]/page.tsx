import { notFound } from "next/navigation";
import db from "@/lib/db";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const { data: app } = await db.from("apps").select("name, description, developer").eq("slug", slug).single();
  if (!app) return {};
  return {
    title: `${app.name} — Shopify App`,
    description: app.description?.slice(0, 160),
  };
}

export default async function AppPage({ params }: Props) {
  const { slug } = await params;
  const { data: app } = await db.from("apps").select("*").eq("slug", slug).single();
  if (!app) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex gap-4 items-start mb-6">
        {app.icon_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={app.icon_url} alt={app.name} className="w-16 h-16 rounded-xl flex-shrink-0" />
        )}
        <div>
          <h1 className="text-2xl font-bold">{app.name}</h1>
          <div className="text-sm text-gray-500 mt-0.5">by {app.developer}</div>
          {app.category && (
            <a
              href={`/apps?category=${encodeURIComponent(app.category)}`}
              className="inline-block text-xs text-blue-500 mt-1 hover:underline"
            >
              {app.category}
            </a>
          )}
        </div>
      </div>

      <div className="flex gap-6 mb-8 text-sm">
        {app.rating > 0 && (
          <div>
            <span className="text-yellow-500 font-semibold text-lg">★ {app.rating}</span>
            {app.review_count > 0 && (
              <span className="text-gray-400 ml-1">({app.review_count} reviews)</span>
            )}
          </div>
        )}
        {app.pricing && (
          <div className="text-green-600 font-medium">{app.pricing}</div>
        )}
      </div>

      <a
        href={app.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 mb-8"
      >
        View on Shopify App Store →
      </a>

      {app.description && (
        <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
          {app.description}
        </div>
      )}
    </div>
  );
}
