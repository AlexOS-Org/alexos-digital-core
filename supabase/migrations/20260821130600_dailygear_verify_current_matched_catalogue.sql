-- Verify only exact first-party catalogue matches whose current facts agree.
-- OCHSTIN and NAVIFORCE remain matched until colour names and the NAVIFORCE
-- price conflict are resolved by the owner.

with target_evidence as (
  select e.id
  from public.dg_product_evidence e
  where e.user_id = 'c8b05141-4253-4bb0-9ca7-8ea32658a02e'::uuid
    and e.source_type = 'instagram_post'
    and e.reconciliation_status = 'matched'
    and e.source_id in (
      '18049099166434184',
      '18054415640598819',
      '18110078479510085',
      '17860604493393391',
      '18269076433278877',
      '18063922423959131',
      '18061781116874671',
      '17926143198059814'
    )
  limit 20
)
update public.dg_product_evidence e
set reconciliation_status = 'verified',
    confidence = 'high',
    historical = false,
    metadata = e.metadata || jsonb_build_object(
      'verification_basis', 'Exact first-party @daily_gearz post identity and observed price matched the current catalogue record; operator stock confirmation remains recorded in metadata.',
      'verified_account', '@daily_gearz',
      'verified_at', '2026-08-21'
    ),
    updated_at = now()
where e.id in (select id from target_evidence);
