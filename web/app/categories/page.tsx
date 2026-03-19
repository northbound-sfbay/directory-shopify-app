import Link from "next/link";
import db from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopify App Categories — Browse by Category",
  description: "Browse Shopify apps by category. Find the best apps for SEO, marketing, analytics, shipping, and more.",
};

export default async function CategoriesPage() {
  const { data: categories } = await db.rpc("get_category_counts");

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">Browse by Category</h1>
        <p className="text-gray-500 mb-8">
          {categories?.length ?? 0} categories across {" "}
          {categories?.reduce((sum: number, c: { count: number }) => sum + Number(c.count), 0).toLocaleString()} apps
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {(categories ?? []).map((cat: { category: string; count: number }) => (
            <Link
              key={cat.category}
              href={`/apps?category=${encodeURIComponent(cat.category)}`}
              className="bg-white border border-gray-200 rounded-lg px-4 py-4 hover:border-green-400 transition"
            >
              <div className="font-medium text-sm">{cat.category}</div>
              <div className="text-xs text-gray-400 mt-1">{cat.count} apps</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
