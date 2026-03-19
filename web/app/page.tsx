import Link from "next/link";
import db from "@/lib/db";

async function getStats() {
  const { count } = await db
    .from("apps")
    .select("*", { count: "exact", head: true })
    .eq("status", "ok");

  const { data: categories } = await db.rpc("get_category_counts");

  const { data: topApps } = await db
    .from("apps")
    .select("slug, name, developer, category, rating, review_count, pricing, icon_url")
    .eq("status", "ok")
    .not("icon_url", "is", null)
    .order("id", { ascending: false })
    .limit(6);

  return { count: count ?? 0, categories: categories ?? [], topApps: topApps ?? [] };
}

export default async function Home() {
  const { count, categories, topApps } = await getStats();

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <section className="bg-white border-b border-gray-200 py-16 px-4 text-center">
        <h1 className="text-4xl font-bold mb-3">Find the Best Shopify Apps</h1>
        <p className="text-gray-500 text-lg mb-8">
          Browse {count.toLocaleString()}+ apps by category, rating, and pricing.
        </p>
        <form action="/apps" method="GET" className="max-w-xl mx-auto flex gap-2">
          <input
            name="q"
            type="text"
            placeholder="Search apps..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Search
          </button>
        </form>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Categories */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.slice(0, 8).map((cat: { category: string; count: number }) => (
              <Link
                key={cat.category}
                href={`/apps?category=${encodeURIComponent(cat.category)}`}
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-green-400 transition"
              >
                <div className="font-medium text-sm">{cat.category}</div>
                <div className="text-xs text-gray-400 mt-0.5">{cat.count} apps</div>
              </Link>
            ))}
            <Link
              href="/categories"
              className="bg-white border border-dashed border-gray-300 rounded-lg px-4 py-3 hover:border-green-400 transition text-sm text-gray-400"
            >
              View all categories →
            </Link>
          </div>
        </section>

        {/* Top Apps */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Top Rated Apps</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topApps.map((app) => (
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
        </section>
      </div>
    </div>
  );
}
