import Link from "next/link";
import db from "@/lib/db";

interface Props {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}

const PAGE_SIZE = 24;

export async function generateMetadata({ searchParams }: Props) {
  const { q, category } = await searchParams;
  const title = category
    ? `${category} Shopify Apps`
    : q
    ? `Search: ${q} — Shopify Apps`
    : "Browse All Shopify Apps";
  return { title };
}

export default async function AppsPage({ searchParams }: Props) {
  const { q, category, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1"));
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = db
    .from("apps")
    .select("slug, name, developer, category, rating, review_count, pricing, icon_url", { count: "exact" })
    .eq("status", "ok")
    .order("review_count", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,developer.ilike.%${q}%`);
  if (category) query = query.eq("category", category);

  const { data: apps, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {category ? `${category} Apps` : q ? `Results for "${q}"` : "All Shopify Apps"}
        </h1>
        <span className="text-sm text-gray-400">{(count ?? 0).toLocaleString()} apps</span>
      </div>

      <form action="/apps" method="GET" className="flex gap-2 mb-8">
        <input
          name="q"
          defaultValue={q}
          type="text"
          placeholder="Search apps..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {category && <input type="hidden" name="category" value={category} />}
        <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
          Search
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {(apps ?? []).map((app) => (
          <Link
            key={app.slug}
            href={`/apps/${app.slug}`}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-green-400 transition flex gap-3"
          >
            {app.icon_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={app.icon_url} alt={app.name} className="w-12 h-12 rounded-lg flex-shrink-0" />
            )}
            <div className="min-w-0">
              <div className="font-medium text-sm truncate">{app.name}</div>
              <div className="text-xs text-gray-400 truncate">{app.developer}</div>
              {app.category && (
                <div className="text-xs text-blue-500 mt-0.5">{app.category}</div>
              )}
              <div className="flex items-center gap-2 mt-1">
                {app.rating > 0 && (
                  <span className="text-xs text-yellow-600">★ {app.rating}</span>
                )}
                {app.review_count > 0 && (
                  <span className="text-xs text-gray-400">({app.review_count})</span>
                )}
                {app.pricing && (
                  <span className="text-xs text-green-600 truncate">{app.pricing}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          {currentPage > 1 && (
            <Link
              href={`/apps?${new URLSearchParams({ ...(q && { q }), ...(category && { category }), page: String(currentPage - 1) })}`}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              ← Prev
            </Link>
          )}
          <span className="px-4 py-2 text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/apps?${new URLSearchParams({ ...(q && { q }), ...(category && { category }), page: String(currentPage + 1) })}`}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
