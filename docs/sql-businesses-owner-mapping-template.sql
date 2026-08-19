-- Run only after reviewing the actual owner UUID for each legacy business.
-- Use a service-role/admin SQL session. Never guess or use the owner of the
-- current browser session unless that is the verified business owner.

-- Example:
-- update public.business_identity_reconciliation
-- set owner_user_id = '<verified-auth-user-uuid>',
--     mapped_at = now(),
--     mapped_by = '<verified-admin-user-uuid>'
-- where legacy_business_id = 'dailygears';

select legacy_business_id, legacy_display_name, owner_user_id, canonical_business_id
from public.business_identity_reconciliation
order by legacy_business_id;
