import fs from 'node:fs';

const input = JSON.parse(fs.readFileSync('/home/ubuntu/alexos-source/notes/dailygear-social-product-candidates-2026-08-22.json', 'utf8'));
const existingSourceIds = new Set([
  '18049099166434184', '18094575518128389', '17960689407087808', '18054415640598819',
  '18110078479510085', '18063922423959131', '17926143198059814', '18269076433278877',
]);
const rules = [
  ['naviforce-ladies-nf5060', /naviforce.*ladies|nf5060/i, 'NAVIFORCE Ladies Watch #NF5060', 'Watches', 'Ladies Watches'],
  ['ochstin-chronograph-6063', /ochstin.*6063/i, 'OCHSTIN Chronograph Gents Watch #6063', 'Watches', 'Men’s Watches'],
  ['berluti-footwear', /berluti/i, 'Berluti Footwear', 'Fashion & Clothing', 'Men’s Shoes'],
  ['timberland-city-walk-sneakers', /timberland.*sneaker|city walk comfort/i, 'Timberland Signature City Walk Comfort Sneakers', 'Fashion & Clothing', 'Men’s Shoes'],
  ['mulberry-silk-duvet-cover-set', /duvet cover|mulberry silk/i, 'Mulberry Silk Duvet Cover Set', 'Home & Living', 'Bedding'],
  ['solar-wireless-power-bank', /solar powerbank|solar wireless power bank|lu-pbw200|30,000.*solar/i, '30,000mAh Solar Wireless Power Bank', 'Power & Energy', 'Power Banks'],
  ['silver-crest-commercial-blender', /silver crest.*blender|7000 watts.*blender/i, 'Silver Crest 7000W Commercial Blender', 'Kitchen & Dining', 'Kitchen Appliances'],
  ['dessert-sole-shoes', /dessert sole/i, 'Dessert Sole Outdoor Shoes', 'Fashion & Clothing', 'Men’s Shoes'],
  ['tote-bag-four-colour', /tote bags|tote collection/i, 'Tote Bag – Four Colour Collection', 'Bags & Luggage', 'Handbags'],
  ['modio-m37-tablet', /modio m37/i, 'Modio M37 Tablet 12GB RAM 512GB ROM', 'Phones & Tablets', 'Tablets'],
  ['foldable-laptop-breakfast-table', /foldable.*(?:laptop )?breakfast table|breakfast table\/work table/i, 'Foldable Laptop Breakfast / Work Table', 'Office & Stationery', 'Office Equipment'],
  ['luxurious-4-in-1-suitcase', /4 in 1.*suitcase|unbreakable suitcase/i, '4-in-1 Luxurious Unbreakable Suitcase', 'Bags & Luggage', 'Suitcases'],
  ['plastic-wardrobe', /3 column plastic wardrobe/i, '3 Column Plastic Wardrobe', 'Home & Living', 'Home Organization'],
  ['ladies-sandals', /ladies sandals/i, 'Ladies Sandals', 'Fashion & Clothing', 'Sandals'],
  ['naviforce-mens-watch', /naviforce watch.*bold statement|rugged design.*digital display/i, 'NAVIFORCE Men’s Digital Display Watch', 'Watches', 'Men’s Watches'],
  ['balcony-privacy-fence', /balcony privacy fence/i, 'Green Balcony Privacy Fence', 'Home & Living', 'Home Accessories'],
  ['bathroom-organizer', /wall-mounted bathroom organizer|dual-tier storage rack/i, 'Modern Wall-Mounted Bathroom Organizer', 'Home & Living', 'Home Organization'],
  ['ladies-long-wallet', /ladies.*long wallet|leather wallet/i, 'Ladies’ Long Leather Wallet', 'Bags & Luggage', 'Wallets'],
  ['ladies-leather-loafers', /ladies.*leather loafers/i, 'Ladies’ Leather Loafers', 'Fashion & Clothing', 'Women’s Shoes'],
  ['women-vulcanized-shoes', /women vulcanized shoes/i, 'Women’s Vulcanized Casual Shoes', 'Fashion & Clothing', 'Women’s Shoes'],
  ['ladies-vulcanized-sneakers', /ladies sneakers vulcanized/i, 'Ladies’ Vulcanized Sneakers', 'Fashion & Clothing', 'Women’s Shoes'],
  ['ladies-fashion-watches', /ordinary ladies watches|premium watches.*lady/i, 'Ladies’ Fashion Watch Collection', 'Watches', 'Ladies Watches'],
  ['jesou-mens-gift-set', /jesou men's gift set/i, '6-in-1 Jesou Men’s Gift Set', 'Fashion & Clothing', 'Men’s Accessories'],
  ['ladies-watch-bracelet-set', /ladies watch\+ bracelet set/i, 'Ladies’ Watch and Bracelet Set', 'Fashion & Clothing', 'Women’s Accessories'],
  ['bluetooth-earphones', /bluetooth earphones|earphones.*8hrs battery|lightweight.*comfortable earphones/i, 'Bluetooth Wireless Earphones', 'Electronics', 'Audio & Headphones'],
  ['kids-trolley-bags', /cartoon themed kids trolley bags/i, 'Cartoon-Themed Kids Trolley Bag', 'Bags & Luggage', 'Suitcases'],
  ['nordic-bedside-cabinet', /nordic luxury double-drawer bedside cabinet/i, 'Nordic Luxury Double-Drawer Bedside Cabinet', 'Home & Living', 'Home Organization'],
  ['kids-swimming-costume', /kids quality swimming costume/i, 'Kids’ Swimming Costume', 'Baby, Kids & Toys', 'Kids Clothing'],
  ['waterproof-kids-apron', /waterproof kids apron/i, 'Waterproof Kids Apron', 'Baby, Kids & Toys', 'Kids Clothing'],
  ['kids-unisex-sneakers', /kids quality unisex sneakers/i, 'Kids’ Unisex Sneakers', 'Fashion & Clothing', 'Kids’ Shoes'],
  ['travel-neck-pillow', /travel neck pillows/i, 'Travel Neck Pillow', 'Bags & Luggage', 'Travel Accessories'],
  ['washing-machine-roller-trolley', /washing machine metal.*stand base|appliance roller trolley/i, 'Adjustable Appliance Roller Trolley', 'Home & Living', 'Household Essentials'],
  ['led-wireless-speaker-charger', /led wireless multifunction|speaker with phone charger/i, 'LED Wireless Speaker with Phone Charger', 'Electronics', 'Speakers'],
  ['foldable-baby-potty', /foldable baby potty seat|potty backrest/i, 'Foldable Baby Potty Training Seat', 'Baby, Kids & Toys', 'Baby Care'],
  ['diamond-jewelry-set', /diamond luxury jewelry set/i, 'Diamond Luxury Jewellery Set', 'Fashion & Clothing', 'Women’s Accessories'],
  ['adjustable-laptop-desk', /adjustable\/movable laptop desk/i, 'Adjustable Movable Laptop Desk', 'Office & Stationery', 'Office Equipment'],
  ['cordless-air-compressor', /cordless digital air compressor|tyre inflator/i, 'Cordless Digital Tyre Inflator', 'Car Accessories', 'Car Tools'],
  ['three-in-one-handbag-set', /3-1 set|3 in 1.*handbag|handbag.*3-1/i, '3-in-1 Handbag Set', 'Bags & Luggage', 'Handbags'],
  ['luxury-handbags', /luxe handbags|luxury meets elegance|djrm classic bag/i, 'Luxury Handbag Collection', 'Bags & Luggage', 'Handbags'],
  ['generic-school-bag', /school bag|school backpack/i, 'Children’s School Backpack Collection', 'Bags & Luggage', 'Backpacks'],
  ['generic-ladies-handbag', /must have handbag|only bag you'll ever need|affordable.*bags that fall apart/i, 'Everyday Ladies’ Handbag', 'Bags & Luggage', 'Handbags'],
  ['generic-leather-shoes', /official leather shoes|leather shoes/i, 'Official Leather Shoes', 'Fashion & Clothing', 'Shoes'],
  ['smartwatch', /smart watch|smartwatch|heart rate monitoring|bluetooth calls/i, 'Smartwatch', 'Electronics', 'Smart Devices'],
  ['car-dent-puller', /car dent puller/i, 'Car Dent Puller', 'Car Accessories', 'Car Tools'],
];

const clusters = new Map();
for (const post of input.posts) {
  if (!post.product_like || post.excluded_from_dailygear || existingSourceIds.has(post.source_id)) continue;
  const rule = rules.find((r) => r[1].test(post.caption));
  const key = rule?.[0] ?? `review-${post.source_id}`;
  const canonical = rule?.[2] ?? (post.caption.split(/\n|\.|!/).map((s) => s.trim()).find(Boolean) ?? `Social product ${post.source_id}`).slice(0, 100);
  const row = clusters.get(key) ?? { key, canonical_name: canonical, category: rule?.[3] ?? 'Deals & Featured', subcategory: rule?.[4] ?? 'Needs classification', source_ids: [], source_urls: [], image_urls: [], observed_prices_kes: [], captions: [], confidence: rule ? 'medium' : 'low' };
  row.source_ids.push(post.source_id);
  row.source_urls.push(post.source_url);
  if (post.image_url && /^https?:\/\//.test(post.image_url)) row.image_urls.push(post.image_url);
  row.observed_prices_kes.push(...post.observed_prices_kes);
  row.captions.push(post.caption);
  clusters.set(key, row);
}
for (const row of clusters.values()) {
  row.source_ids = [...new Set(row.source_ids)];
  row.source_urls = [...new Set(row.source_urls)];
  row.image_urls = [...new Set(row.image_urls)];
  row.observed_prices_kes = [...new Set(row.observed_prices_kes)];
  row.review_reason = row.confidence === 'low' ? 'No exact product-family rule matched; keep Draft and require owner review before publication.' : 'Imported as Draft from social evidence; verify image identity, supplier cost, variants, and stock before publication.';
}
const output = { source_account: '@daily_gearz', excluded_existing_source_ids: [...existingSourceIds], clusters: [...clusters.values()].sort((a, b) => a.canonical_name.localeCompare(b.canonical_name)) };
fs.writeFileSync('/home/ubuntu/alexos-source/notes/dailygear-draft-clusters-2026-08-22.json', `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ clusters: output.clusters.length, posts_assigned: output.clusters.reduce((n, r) => n + r.source_ids.length, 0), low_confidence: output.clusters.filter((r) => r.confidence === 'low').length }));
