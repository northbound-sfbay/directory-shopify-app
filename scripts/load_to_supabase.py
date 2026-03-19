"""
Loads enriched_apps.csv into Supabase via the REST API.

Usage:
    pip3 install supabase
    python3 scripts/load_to_supabase.py
"""

import csv
import os
import sys

from supabase import create_client

# Read from web/.env.local
env_path = os.path.join(os.path.dirname(__file__), "../web/.env.local")
env = {}
with open(env_path) as f:
    for line in f:
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            env[k] = v

SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Missing Supabase credentials in web/.env.local")
    sys.exit(1)


def load_csv(path: str) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def clean(row: dict):
    if row.get("status") != "ok":
        return None

    def num(v, cast):
        try:
            return cast(v) if v and str(v).strip() else None
        except (ValueError, AttributeError):
            return None

    return {
        "url": row["url"],
        "slug": row["slug"],
        "name": row["name"] or None,
        "developer": row["developer"] or None,
        "category": row["category"] or None,
        "rating": num(row["rating"], float),
        "review_count": num(row["review_count"], int),
        "pricing": row["pricing"] or None,
        "description": row["description"] or None,
        "icon_url": row["icon_url"] or None,
        "status": row["status"],
    }


def main():
    csv_path = os.path.join(os.path.dirname(__file__), "../enriched_apps.csv")
    if not os.path.exists(csv_path):
        print(f"ERROR: {csv_path} not found")
        sys.exit(1)

    rows = load_csv(csv_path)
    data = [r for row in rows if (r := clean(row))]
    print(f"Loaded {len(data)} valid rows from CSV")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Insert in batches of 500
    batch_size = 500
    total = 0
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        supabase.table("apps").upsert(batch, on_conflict="slug").execute()
        total += len(batch)
        print(f"  Upserted {total}/{len(data)}...")

    print(f"Done — {total} apps loaded into Supabase")


if __name__ == "__main__":
    main()
