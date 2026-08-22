import json
from pathlib import Path
from openai import OpenAI

candidates = json.loads(Path('/home/ubuntu/alexos-source/notes/dailygear-social-product-candidates-2026-08-22.json').read_text())
posts = [p for p in candidates['posts'] if p['product_like'] and not p['excluded_from_dailygear']]
existing = json.loads(Path('/home/ubuntu/alexos-source/notes/current-dailygear-catalogue.json').read_text()) if Path('/home/ubuntu/alexos-source/notes/current-dailygear-catalogue.json').exists() else {}

schema = {
  'type': 'object',
  'additionalProperties': False,
  'properties': {
    'clusters': {
      'type': 'array',
      'items': {
        'type': 'object',
        'additionalProperties': False,
        'properties': {
          'canonical_name': {'type': 'string'},
          'category': {'type': 'string'},
          'subcategory': {'type': 'string'},
          'brand': {'type': ['string', 'null']},
          'source_ids': {'type': 'array', 'items': {'type': 'string'}},
          'source_urls': {'type': 'array', 'items': {'type': 'string'}},
          'image_urls': {'type': 'array', 'items': {'type': 'string'}},
          'observed_prices_kes': {'type': 'array', 'items': {'type': 'number'}},
          'variant_evidence': {'type': 'array', 'items': {'type': 'string'}},
          'copy_facts': {'type': 'array', 'items': {'type': 'string'}},
          'confidence': {'type': 'string', 'enum': ['high', 'medium', 'low']},
          'review_reason': {'type': 'string'}
        },
        'required': ['canonical_name','category','subcategory','brand','source_ids','source_urls','image_urls','observed_prices_kes','variant_evidence','copy_facts','confidence','review_reason']
      }
    }
  },
  'required': ['clusters']
}

prompt = {
  'instruction': 'Cluster the supplied DailyGear Instagram product posts into unique parent products. Exclude supplements (already removed). Do not merge visibly different products. Merge only obvious repeated posts of the same product. Preserve exact observed prices as evidence, never infer an unobserved price. Extract only variants explicitly supported by captions (colour, sex/audience, size, capacity, or model). Use a low confidence cluster when the caption is too vague. Existing catalogue names are context only; mark a candidate for review if it may already exist. Return JSON only.',
  'existing_catalogue_names': existing.get('names', []),
  'posts': posts,
}

client = OpenAI()
response = client.chat.completions.create(
    model='gpt-5-mini',
    messages=[
        {'role': 'system', 'content': 'You are an evidence-first catalogue reconciliation analyst. Never invent product facts.'},
        {'role': 'user', 'content': json.dumps(prompt, ensure_ascii=False)},
    ],
    response_format={'type': 'json_schema', 'json_schema': {'name': 'dailygear_clusters', 'strict': True, 'schema': schema}},
    max_completion_tokens=12000,
)
content = response.choices[0].message.content
out = json.loads(content)
Path('/home/ubuntu/alexos-source/notes/dailygear-product-clusters-2026-08-22.json').write_text(json.dumps(out, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({'clusters': len(out['clusters']), 'posts_classified': len(posts)}))
