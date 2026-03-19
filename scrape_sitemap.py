"""
Seeds the app list by parsing the Shopify App Store sitemap.
Outputs a CSV of app URLs.

Usage:
    python3 scrape_sitemap.py
"""

import csv
import subprocess
import xml.etree.ElementTree as ET

SITEMAP_INDEX = "https://apps.shopify.com/sitemap.xml"
OUTPUT_FILE = "app_urls.csv"


def curl_get(url: str) -> str:
    result = subprocess.run(
        ["curl", "-s", "-L", "--max-time", "30", url],
        capture_output=True, text=True
    )
    return result.stdout


def parse_app_urls(xml: str) -> list[str]:
    """Extract app URLs from sitemap."""
    root = ET.fromstring(xml)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = []
    for loc in root.findall(".//sm:loc", ns):
        url = loc.text.strip()
        if url.startswith("https://apps.shopify.com/") and url.count("/") == 3:
            urls.append(url)
    return urls


def main():
    print("Fetching sitemap...")
    xml = curl_get(SITEMAP_INDEX)
    all_urls = sorted(set(parse_app_urls(xml)))
    print(f"Total unique app URLs: {len(all_urls)}")

    with open(OUTPUT_FILE, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["url"])
        for url in all_urls:
            writer.writerow([url])

    print(f"Saved to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
