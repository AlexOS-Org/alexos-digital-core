import fs from "node:fs";
const plan = JSON.parse(
  fs.readFileSync(
    "/home/ubuntu/alexos-source/notes/dailygear-draft-clusters-2026-08-22.json",
    "utf8",
  ),
);
const owner = "c8b05141-4253-4bb0-9ca7-8ea32658a02e";
function s(v) {
  return `'${String(v ?? "").replaceAll("'", "''")}'`;
}
function slug(v) {
  return v
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}
function j(v) {
  return `${s(JSON.stringify(v))}::jsonb`;
}
function variants(row) {
  const text = row.captions.join(" ");
  const found = [];
  const colorMatch = text.match(
    /(?:colou?rs?|available in|available:|colou?r options?)\s*[:\-]?\s*([a-z][a-z ,/&-]{2,80})/i,
  );
  if (colorMatch) {
    for (const c of colorMatch[1]
      .split(/[,/&]|\band\b/i)
      .map((x) => x.trim().replace(/[.!]+$/, ""))
      .filter((x) => /^[a-z][a-z -]{1,24}$/i.test(x))) {
      if (!found.some((x) => x.color.toLowerCase() === c.toLowerCase())) found.push({ color: c });
    }
  }
  if (/unisex/i.test(text) && !found.some((x) => x.audience)) found.push({ audience: "Unisex" });
  if (/boy|boys/i.test(text) && !/girl|girls/i.test(text)) found.push({ audience: "Boy" });
  if (/girl|girls/i.test(text) && !/boy|boys/i.test(text)) found.push({ audience: "Girl" });
  if (!found.length) found.push({});
  return found;
}
const out = [
  "-- Social-import variants remain editable, zero-stock, and unavailable until owner verification.",
  "BEGIN;",
];
for (const row of plan.clusters) {
  const productSlug = slug(row.canonical_name) || row.key;
  const img = row.image_urls.find((x) => /^https?:\/\//.test(x)) || null;
  variants(row).forEach((opt, i) => {
    const label = opt.color || opt.audience || "Default";
    const sku = `DG-VAR-${row.key
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .slice(0, 34)}-${i + 1}`;
    out.push(
      `insert into public.dg_product_variants (user_id, product_id, name, sku, price, sale_price, cost_price, stock_quantity, options, image_url, sort_order) select ${s(owner)}::uuid, p.id, ${s(label)}, ${s(sku)}, p.price, null, null, 0, ${j(opt)}, ${img ? s(img) : "null"}, ${i} from public.dg_products p where p.user_id=${s(owner)}::uuid and p.slug=${s(productSlug)} and p.attributes->>'import_source' = 'instagram' and p.status = 'draft' and p.deleted_at is null and not exists (select 1 from public.dg_product_variants v where v.product_id=p.id and v.sku=${s(sku)});`,
    );
  });
}
out.push("COMMIT;");
fs.writeFileSync(
  "/home/ubuntu/alexos-source/notes/dailygear-variant-import-2026-08-22.sql",
  out.join("\n") + "\n",
);
console.log(
  JSON.stringify({
    products: plan.clusters.length,
    variants: plan.clusters.reduce((n, r) => n + variants(r).length, 0),
  }),
);
