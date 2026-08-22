import json
import re
from pathlib import Path

RESULTS = [
    Path('/tmp/manus-mcp/mcp_result_c27026c1-9ce3-4c48-b725-92927a9f6a59.json'),
    Path('/tmp/manus-mcp/mcp_result_879e0bc1-0b3b-4838-b4d8-a477f3990cba.json'),
    Path('/tmp/manus-mcp/mcp_result_9ff254e2-1f85-4a15-bd74-58fdbf5934bb.json'),
    Path('/tmp/manus-mcp/mcp_result_e7cab698-f2e7-4288-8cc9-158e29e9f983.json'),
    Path('/tmp/manus-mcp/mcp_result_3ab8cf8c-72a7-46b4-963b-6dce619d17be.json'),
]
OUT = Path('/home/ubuntu/alexos-source/notes/dailygear-social-product-candidates-2026-08-22.json')

price_re = re.compile(r'(?i)(?:ksh|kes|price|selling|only|@)\s*\.?\s*([0-9][0-9,]*(?:\.[0-9]+)?)')
exclude_re = re.compile(r'(?i)bf\s*suma|bfsuma|veggie\s*veggie|dietary supplement|supplement')

posts = []
for result_path in RESULTS:
    payload = json.loads(result_path.read_text())
    posts.extend(payload.get('result', {}).get('data', []))

seen = set()
rows = []
for post in posts:
    pid = str(post.get('id'))
    if pid in seen:
        continue
    seen.add(pid)
    caption = (post.get('caption') or '').strip()
    prices = []
    for match in price_re.finditer(caption):
        try:
            prices.append(float(match.group(1).replace(',', '')))
        except ValueError:
            pass
    rows.append({
        'source': 'instagram',
        'source_account': '@daily_gearz',
        'source_id': pid,
        'source_url': post.get('permalink'),
        'timestamp': post.get('timestamp'),
        'media_type': post.get('media_type'),
        'media_url': post.get('media_url'),
        'caption': caption,
        'prices_found_kes': prices,
        'excluded_from_dailygear': bool(exclude_re.search(caption)),
        'exclusion_reason': 'supplement / BF Suma content' if exclude_re.search(caption) else None,
    })

rows.sort(key=lambda row: row.get('timestamp') or '', reverse=True)
OUT.write_text(json.dumps({'account': '@daily_gearz', 'post_count': len(rows), 'posts': rows}, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({'post_count': len(rows), 'excluded_count': sum(r['excluded_from_dailygear'] for r in rows), 'output': str(OUT)}, indent=2))
