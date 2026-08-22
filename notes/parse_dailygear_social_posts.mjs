import fs from 'node:fs';
import path from 'node:path';

const rawDir = '/home/ubuntu/alexos-source/notes/social-source-raw';
const files = fs.readdirSync(rawDir).filter((f) => f.endsWith('.json')).sort();
const priceRe = /(?:ksh|kes|price|selling|only|@)\s*\.?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/ig;
const excludeRe = /bf\s*suma|bfsuma|veggie\s*veggie|dietary supplement|supplement/i;
const productSignalRe = /price|ksh|kes|watch|bag|shoe|table|wardrobe|charger|powerbank|blender|earphone|camera|sandal|wallet|pillow|suitcase|compressor|apron|backpack|sneaker|dress|cabinet|handbag|loafers|smart|car dent|tyre|duvet|privacy fence|organizer/i;
const posts = [];
for (const file of files) {
  const payload = JSON.parse(fs.readFileSync(path.join(rawDir, file), 'utf8'));
  for (const post of payload?.result?.data ?? []) posts.push(post);
}
const unique = new Map();
for (const post of posts) {
  if (!post?.id || unique.has(post.id)) continue;
  const caption = (post.caption ?? '').trim();
  const prices = [];
  for (const match of caption.matchAll(priceRe)) prices.push(Number(match[1].replaceAll(',', '')));
  const excluded = excludeRe.test(caption);
  unique.set(post.id, {
    source_type: 'instagram_post',
    source_account: '@daily_gearz',
    source_id: String(post.id),
    source_url: post.permalink,
    source_date: post.timestamp,
    media_type: post.media_type,
    image_url: post.media_url ?? null,
    caption,
    observed_prices_kes: [...new Set(prices.filter(Number.isFinite))],
    excluded_from_dailygear: excluded,
    exclusion_reason: excluded ? 'supplement / BF Suma content' : null,
    product_like: productSignalRe.test(caption),
  });
}
const result = [...unique.values()].sort((a, b) => String(b.source_date).localeCompare(String(a.source_date)));
const output = { source_account: '@daily_gearz', fetched_files: files, fetched_posts: result.length, excluded_count: result.filter((r) => r.excluded_from_dailygear).length, product_like_count: result.filter((r) => r.product_like && !r.excluded_from_dailygear).length, posts: result };
fs.writeFileSync('/home/ubuntu/alexos-source/notes/dailygear-social-product-candidates-2026-08-22.json', `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ fetched_posts: output.fetched_posts, excluded_count: output.excluded_count, product_like_count: output.product_like_count }));
