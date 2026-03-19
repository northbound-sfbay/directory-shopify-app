import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FindShopifyApps — Find the Best Shopify Apps",
  description:
    "Browse and compare 17,000+ Shopify apps by category, rating, and pricing. Find the best apps for your store.",
  metadataBase: new URL("https://www.findshopifyapps.com"),
  alternates: { canonical: "https://www.findshopifyapps.com" },
  openGraph: {
    siteName: "FindShopifyApps",
    url: "https://www.findshopifyapps.com",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.className}>
      <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-8DQ33ST0PT" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-8DQ33ST0PT');
        `}</Script>
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900" style={{ backgroundColor: '#f9fafb', color: '#111827' }}>
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-6">
            <a href="/" className="text-lg font-bold text-green-600">
              Appfinder
            </a>
            <nav className="flex gap-4 text-sm text-gray-600">
              <a href="/apps" className="hover:text-gray-900">Browse Apps</a>
              <a href="/categories" className="hover:text-gray-900">Categories</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-gray-200 mt-16 py-8 text-center text-sm text-gray-400">
          AppFinder is not affiliated with Shopify Inc.
        </footer>
      </body>
    </html>
  );
}
