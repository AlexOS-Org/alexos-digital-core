#!/usr/bin/env python3
"""Create a review report for draft products with no images.

This script is intentionally read-only. It consumes a saved Supabase MCP result
(or a plain JSON array) and writes Markdown/CSV review artifacts.
"""
from __future__ import annotations

import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path


def load_rows(path: Path) -> list[dict]:
    raw = json.loads(path.read_text())
    value = raw.get("result", raw) if isinstance(raw, dict) else raw
    if isinstance(value, str):
        match = re.search(r"<untrusted-data-[^>]+>\s*(\[.*?\])\s*</untrusted-data-", value, re.S)
        if not match:
            raise ValueError("Could not locate the JSON result array")
        value = json.loads(match.group(1))
    if not isinstance(value, list):
        raise ValueError("Expected a list of product rows")
    return value


def classify(name: str) -> str:
    text = name.casefold()
    rules = [
        ("Power banks", r"power bank|mah"),
        ("Watches", r"watch|naviforce|skmei|curren|colmi|megir"),
        ("School bags and backpacks", r"school|backpack|backpack|sultan|miyouqi|top bear"),
        ("Handbags and fashion bags", r"handbag|sling bag|travel bag|duffel|bag"),
        ("Automotive accessories", r"tyre|tire|car charger|dent puller|appliance roller"),
        ("Baby and children", r"baby|kids|children"),
        ("Home and office", r"laptop stand|desk|table|cabinet|wardrobe|fence"),
        ("Consumer electronics and security", r"camera|smartwatch|speaker|earphone"),
    ]
    for label, pattern in rules:
        if re.search(pattern, text):
            return label
    return "Needs manual category review"


def flags(row: dict) -> list[str]:
    issues: list[str] = ["MISSING_PRODUCT_IMAGE"]
    if int(row.get("variant_count") or 0) == 0:
        issues.append("NO_VARIANTS")
    if row.get("price") in (None, "", 0, "0"):
        issues.append("MISSING_PRICE")
    if re.search(r"for just ksh|new arrival|more than just|don't let|secure your space", row["name"], re.I):
        issues.append("MARKETING_STYLE_TITLE_REVIEW")
    if re.search(r"power bank|mah", row["name"], re.I) and not re.search(r"\b\d{4,6}\s*m?ah\b", row["name"], re.I):
        issues.append("CAPACITY_OR_MODEL_REVIEW")
    return issues


def main() -> int:
    if len(sys.argv) != 3:
        print(f"usage: {sys.argv[0]} INPUT_JSON OUTPUT_BASENAME", file=sys.stderr)
        return 2
    rows = load_rows(Path(sys.argv[1]))
    enriched = []
    for row in rows:
        enriched.append({
            **row,
            "family": classify(row["name"]),
            "flags": flags(row),
        })
    enriched.sort(key=lambda row: (row["family"], row["name"].casefold()))
    base = Path(sys.argv[2])
    csv_path = base.with_suffix(".csv")
    md_path = base.with_suffix(".md")
    fields = ["id", "name", "slug", "family", "price", "variant_count", "flags"]
    with csv_path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for row in enriched:
            writer.writerow({**row, "flags": ";".join(row["flags"])})
    families = Counter(row["family"] for row in enriched)
    all_flags = Counter(flag for row in enriched for flag in row["flags"])
    lines = [
        "# DailyGear draft products missing images",
        "",
        "> Read-only report generated from the live Supabase catalogue. No product record was changed, published, deleted or archived.",
        "",
        f"**Flagged records:** {len(enriched)}",
        "",
        "## Classification summary",
        "",
        "| Product family | Count |",
        "|---|---:|",
    ]
    lines.extend(f"| {family} | {count} |" for family, count in sorted(families.items()))
    lines += ["", "## Review flags", "", "| Flag | Count |", "|---|---:|"]
    lines.extend(f"| `{flag}` | {count} |" for flag, count in sorted(all_flags.items()))
    lines += ["", "## Product review queue", "", "| Product | Family | Price | Variants | Flags |", "|---|---|---:|---:|---|"]
    for row in enriched:
        price = row.get("price") or "Not set"
        lines.append(f"| {row['name'].replace('|', '\\|')} | {row['family']} | {price} | {row.get('variant_count', 0)} | {', '.join(f'`{flag}`' for flag in row['flags'])} |")
    lines += [
        "",
        "## Safe next action",
        "",
        "Keep every flagged item in `draft` status. For each item, confirm the permanent external image URL, parent-product identity, category, variants and price before publishing. Items with `NO_VARIANTS` require variant setup or an explicit confirmation that the product is single-variant. Items with `MISSING_PRICE` require a supplier-cost and selling-price decision. No image URL was invented by this report.",
    ]
    md_path.write_text("\n".join(lines) + "\n")
    print(f"flagged={len(enriched)}")
    print(f"markdown={md_path}")
    print(f"csv={csv_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
