# AlexOS repository guidance

## Governing protocol
Read `docs/GOVERNED_BUILD_PROTOCOL.md` before making any code change. It is the
audit-first, evidence-based change protocol: feature-branch/PR only, full
validation gate before commit, public-storefront immutability check, and no
production/hosted mutations without explicit approval.

## Source of truth
GitHub is the source of truth for the application code. Production infrastructure must not depend on a third-party editor or hosted development environment.

## Safe change policy
- Never commit secrets, `.env` files, private keys, or service-role credentials.
- Keep Supabase credentials in the deployment environment only.
- Treat `supabase/config.toml` as the canonical linked Supabase project configuration.
- Do not rewrite published history merely to remove old development metadata; rotate exposed credentials instead.
- Prefer additive, reversible changes and verify builds before production deployment.

## Supabase
The controlled production Supabase project is `goafwbrayepaihxbqsse`. Client code may use the publishable key; service-role credentials are server-only.
