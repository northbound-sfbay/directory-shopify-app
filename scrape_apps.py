"""
Scrapes app details from Shopify App Store for each URL in app_urls.csv.
Outputs enriched_apps.csv with name, developer, category, rating, reviews, pricing, description.

Usage:
    python3 scrape_apps.py
    python3 scrape_apps.py --limit 50   # test on first N apps
    python3 scrape_apps.py --workers 3  # concurrency (default: 3)
"""

import argparse
import csv
import json
import re
import subprocess
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from bs4 import BeautifulSoup
from tqdm import tqdm

INPUT_FILE = "app_urls.csv"
OUTPUT_FILE = "enriched_apps.csv"
TIMEOUT = 15
REQUEST_DELAY = 1.5

FIELDNAMES = ["url", "slug", "name", "developer", "category", "rating",
              "review_count", "pricing", "description", "icon_url", "status"]

_rate_lock = threading.Lock()
_last_request_time = 0.0


def curl_get(url: str) -> str:
    global _last_request_time
    with _rate_lock:
        now = time.time()
        wait = REQUEST_DELAY - (now - _last_request_time)
        if wait > 0:
            time.sleep(wait)
        _last_request_time = time.time()

    result = subprocess.run(
        ["curl", "-s", "-L", "--max-time", str(TIMEOUT),
         "-H", "Accept-Language: en-US,en;q=0.9",
         url],
        capture_output=True, text=True
    )
    return result.stdout


def parse_app(url: str, html: str) -> dict:
    slug = url.rstrip("/").split("/")[-1]
    base = {"url": url, "slug": slug, "name": None, "developer": None,
            "category": None, "rating": None, "review_count": None,
            "pricing": None, "description": None, "icon_url": None, "status": "ok"}

    if not html or len(html) < 500:
        base["status"] = "empty"
        return base

    soup = BeautifulSoup(html, "lxml")

    # Check for 404 / error page
    title = soup.find("title")
    if title and "doesn't exist" in title.text:
        base["status"] = "not_found"
        return base

    # Name
    h1 = soup.find("h1")
    base["name"] = h1.get_text(strip=True) if h1 else None

    # Developer + icon from JSON-LD
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string)
            if data.get("@type") == "SoftwareApplication":
                brand = data.get("brand")
                if isinstance(brand, dict):
                    base["developer"] = brand.get("name")
                elif isinstance(brand, str):
                    base["developer"] = brand
                images = data.get("image", [])
                if images:
                    base["icon_url"] = images[0] if isinstance(images, list) else images
        except (json.JSONDecodeError, AttributeError):
            pass

    # Description from meta
    meta_desc = soup.find("meta", attrs={"name": "description"})
    if meta_desc:
        base["description"] = meta_desc.get("content", "").strip()

    # Category — app-specific category link (surface_type=app_details)
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "/categories/" in href and f"surface_detail={slug}" in href and "feature_handles" not in href:
            cat_slug = href.split("/categories/")[1].split("?")[0]
            base["category"] = a.get_text(strip=True) or cat_slug
            break

    # Rating and review count
    text = soup.get_text(" ")
    rating_match = re.search(r'Rating\s*([\d.]+)\s*\(\s*([\d,]+)\s*[Rr]eviews?\)', text)
    if rating_match:
        base["rating"] = float(rating_match.group(1))
        base["review_count"] = int(rating_match.group(2).replace(",", ""))

    # Pricing
    pricing_match = re.search(r'Pricing\s*(.{3,80}?)(?:\s*Rating|\s*Developer|\n)', text)
    if pricing_match:
        base["pricing"] = pricing_match.group(1).strip()

    return base


def load_urls(limit=None) -> list[str]:
    with open(INPUT_FILE) as f:
        urls = [row["url"] for row in csv.DictReader(f)]
    return urls[:limit] if limit else urls


def load_completed() -> set[str]:
    try:
        with open(OUTPUT_FILE) as f:
            return {row["url"] for row in csv.DictReader(f)}
    except FileNotFoundError:
        return set()


def scrape_app(url: str) -> dict:
    html = curl_get(url)
    return parse_app(url, html)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--workers", type=int, default=3)
    args = parser.parse_args()

    all_urls = load_urls(args.limit)
    completed = load_completed()
    urls = [u for u in all_urls if u not in completed]

    if completed:
        print(f"Resuming — {len(completed)} done, {len(urls)} remaining")
    else:
        print(f"Scraping {len(urls)} apps with {args.workers} workers...")

    write_header = len(completed) == 0
    out_file = open(OUTPUT_FILE, "a", newline="", encoding="utf-8")
    writer = csv.DictWriter(out_file, fieldnames=FIELDNAMES)
    if write_header:
        writer.writeheader()

    counts = {"ok": 0, "not_found": 0, "error": 0}

    try:
        with ThreadPoolExecutor(max_workers=args.workers) as executor:
            futures = {executor.submit(scrape_app, u): u for u in urls}
            for future in tqdm(as_completed(futures), total=len(futures), desc="Scraping"):
                result = future.result()
                writer.writerow(result)
                out_file.flush()
                status = result["status"]
                if status == "ok":
                    counts["ok"] += 1
                elif status == "not_found":
                    counts["not_found"] += 1
                else:
                    counts["error"] += 1
    finally:
        out_file.close()

    print(f"\nDone. Saved to {OUTPUT_FILE}")
    print(f"  OK:         {counts['ok']}")
    print(f"  Not found:  {counts['not_found']}")
    print(f"  Error:      {counts['error']}")


if __name__ == "__main__":
    main()
