import fs from 'node:fs';

const plan = JSON.parse(fs.readFileSync('/home/ubuntu/alexos-source/notes/dailygear-draft-clusters-2026-08-22.json', 'utf8'));
const ownerId = 'c8b05141-4253-4bb0-9ca7-8ea32658a02e';
const categoryIds = {
  'Bags & Luggage': '7b969ddd-0f59-49a4-925b-72f2cb7bf465',
  'Backpacks': 'b7727ded-2fb9-4df1-b6e0-50037a8cf4f5',
  'Laptop Bags': 'b8a575a1-360c-491c-aba2-c87748e061be',
  'Handbags': '4e65f4e3-4f60-47c2-b9c9-2f748f1de93f',
  'Travel Bags': '9df17699-17be-4301-9840-fc552ac163ac',
  'Duffel Bags': 'e3b74437-a668-4650-80f3-df13c0a32116',
  'Suitcases': '03a34265-e668-4992-8150-0583ef372d3a',
  'Wallets': 'cc66a96e-bfb1-48b2-8f97-d20f5d653e7e',
  'Travel Accessories': '1a4796ff-1c28-4c40-b045-f7b5b4c35589',
  'Home & Living': 'af772f14-c812-45ef-84b8-07fc9a8644df',
  'Home Organization': '0b35d539-4033-49aa-881f-8b7a4b61ccf7',
  'Home Accessories': 'e6ead195-b556-4ef9-8ed0-625b4ec57b28',
  'Household Essentials': 'dff4ee7a-d7f9-43b4-a841-5d462afbf692',
  'Electronics': '18926fce-c93f-4854-8d8f-7a6797a3dcdd',
  'Audio & Headphones': 'b2e6d6e1-ac60-4e53-bdf3-5e51fe215fd5',
  'Speakers': 'ab4a5745-62ef-4644-98db-a8a3e159fb06',
  'Smart Devices': 'e573de02-79bd-40ca-9502-b08d989e5ec4',
  'Power & Energy': '9e582f94-c788-44b0-aa0e-00767740cd28',
  'Power Banks': '3dfe9c8e-b602-47a5-9da0-8866f6ab3809',
  'Chargers': 'ead126c8-e2d3-4945-85b6-a2be6f3c6c48',
  'Office & Stationery': '4bf2f104-faf2-470f-8dc1-71b667523f4b',
  'Office Equipment': '5f74b48e-ada9-4fb2-a83d-64fd62b050b3',
  'Health & Fitness': '86448ef3-a023-4325-b1a3-119683b8224a',
  'Baby, Kids & Toys': 'fa771771-926b-41af-a51f-d0d5b6b2410b',
  'Fashion & Clothing': 'b7d7496b-df4b-4bd6-9f78-cc82e252fda0',
  'Sandals': 'c0537de9-767d-46a6-b6ae-672009e948b2',
  'Shoes': '8770ee1e-513e-43c2-8547-47f946a3a757',
  'Car Accessories': '9a574caf-3e6c-4afe-93a9-dcbb13f68fb1',
  'Kitchen & Dining': '4a107a96-6c69-42d4-95ed-dd58ab1ad598',
  'Deals & Featured': '23afa7b6-6154-49e0-b6ed-29ceff0f2f70',
};

function sqlString(value) {
  return `'${String(value ?? '').replaceAll("'", "''")}'`;
}
function jsonb(value) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}
function textArray(values) {
  const safe = values.filter(Boolean).map((v) => sqlString(v));
  return `ARRAY[${safe.join(', ')}]::text[]`;
}
function slugify(value) {
  return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
}
function categoryId(row) {
  return categoryIds[row.subcategory] ?? categoryIds[row.category] ?? categoryIds['Deals & Featured'];
}
function imageUrls(row) {
  return row.image_urls.filter((url) => /^https?:\/\//.test(url) && !/\.mp4(?:\?|$)/i.test(url));
}
function price(row) {
  const observed = [...new Set(row.observed_prices_kes.filter((n) => Number.isFinite(n) && n >= 100))];
  return observed.length === 1 ? observed[0] : null;
}
function aida(row) {
  const proof = row.captions[0]?.replace(/\s+/g, ' ').slice(0, 260) || 'Source post requires owner review for product facts.';
  return `Attention: ${row.canonical_name}. Interest: a practical option selected from DailyGear’s published social catalogue. Desire: use the documented features and variants to choose the right option for your routine. Action: review the source evidence, add supplier cost and stock, then publish only after verification. Source evidence: ${proof}`;
}

const statements = [];
const normalizedClusters = [];
const byIdentity = new Map();
for (const row of plan.clusters) {
  const identity = row.image_urls[0] ? `${row.canonical_name}|${row.image_urls[0]}` : `${row.canonical_name}|${row.key}`;
  const prior = byIdentity.get(identity);
  if (!prior) {
    byIdentity.set(identity, row);
    normalizedClusters.push(row);
  } else {
    prior.source_ids.push(...row.source_ids);
    prior.source_urls.push(...row.source_urls);
    prior.image_urls.push(...row.image_urls);
    prior.observed_prices_kes.push(...row.observed_prices_kes);
    prior.captions.push(...row.captions);
    prior.source_ids = [...new Set(prior.source_ids)];
    prior.source_urls = [...new Set(prior.source_urls)];
    prior.image_urls = [...new Set(prior.image_urls)];
    prior.observed_prices_kes = [...new Set(prior.observed_prices_kes)];
  }
}
for (const row of normalizedClusters) {
  const slug = slugify(row.canonical_name) || row.key;
  const imageList = imageUrls(row);
  const p = price(row);
  const facts = {
    import_source: 'instagram',
    source_account: plan.source_account,
    source_ids: row.source_ids,
    source_urls: row.source_urls,
    source_image_urls: row.image_urls,
    observed_prices_kes: row.observed_prices_kes,
    variant_evidence: [],
    import_state: 'draft_pending_media_variant_cost_stock_review',
    confidence: row.confidence,
    note: row.review_reason,
  };
  const description = aida(row);
  const keywords = [row.canonical_name, row.category, row.subcategory, 'Kenya', 'DailyGear'].filter(Boolean);
  statements.push(`insert into public.dg_products (user_id, name, description, short_description, category_id, sku, price, currency, stock_quantity, low_stock_threshold, status, images, tags, attributes, slug, seo_title, seo_description, seo_keywords, image_alt_text, availability_confirmed) select ${sqlString(ownerId)}, ${sqlString(row.canonical_name)}, ${sqlString(description)}, ${sqlString(`Draft product record from DailyGear social evidence: ${row.canonical_name}`)}, ${sqlString(categoryId(row))}::uuid, ${sqlString(`DG-SOC-${row.key.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 42)}`)}, ${p === null ? 'null' : p}, 'KES', 0, 5, 'draft', ${textArray(imageList)}, ${textArray(['social-import', 'instagram', row.category, row.subcategory])}, ${jsonb(facts)}, ${sqlString(slug)}, ${sqlString(`${row.canonical_name} | DailyGear Kenya`)}, ${sqlString(`Review ${row.canonical_name} from DailyGear Kenya. Verify current availability, supplier cost, variants, and external product images before publishing.`)}, ${textArray(keywords)}, ${sqlString(`${row.canonical_name} product image from DailyGear social source`)}, false where not exists (select 1 from public.dg_products p where p.user_id = ${sqlString(ownerId)}::uuid and p.slug = ${sqlString(slug)} and p.deleted_at is null);`);
}
statements.push(`insert into public.dg_product_evidence (user_id, product_id, source_type, source_id, source_url, source_label, title, raw_excerpt, observed_price, observed_currency, observed_attributes, metadata, confidence, reconciliation_status, historical) select ${sqlString(ownerId)}::uuid, p.id, 'instagram_post', sid.value, urls.value, 'DailyGear Instagram @daily_gearz', p.name, left(p.description, 600), case when jsonb_array_length(p.attributes->'observed_prices_kes') = 1 then (p.attributes->'observed_prices_kes'->>0)::numeric else null end, 'KES', jsonb_build_object('source_ids', p.attributes->'source_ids', 'observed_prices_kes', p.attributes->'observed_prices_kes'), jsonb_build_object('source_account', p.attributes->>'source_account', 'source_image_urls', p.attributes->'source_image_urls'), case when p.attributes->>'confidence' = 'high' then 'high' when p.attributes->>'confidence' = 'medium' then 'medium' else 'low' end, 'candidate', true from public.dg_products p cross join lateral jsonb_array_elements_text(p.attributes->'source_ids') with ordinality sid(value, ord) join lateral jsonb_array_elements_text(p.attributes->'source_urls') with ordinality urls(value, ord) on urls.ord = sid.ord where p.user_id = ${sqlString(ownerId)}::uuid and p.attributes->>'import_source' = 'instagram' and p.deleted_at is null and not exists (select 1 from public.dg_product_evidence e where e.product_id = p.id and e.source_id = sid.value) on conflict (user_id, source_type, source_id) do nothing;`);

fs.writeFileSync('/home/ubuntu/alexos-source/notes/dailygear-draft-import-2026-08-22.sql', `-- Staged DailyGear social import. All rows remain Draft, zero-stock, availability unconfirmed.\n-- External image URLs only; no local product media is written.\nBEGIN;\n${statements.join('\n')}\nCOMMIT;\n`);
console.log(JSON.stringify({ products: normalizedClusters.length, sql: '/home/ubuntu/alexos-source/notes/dailygear-draft-import-2026-08-22.sql' }));
