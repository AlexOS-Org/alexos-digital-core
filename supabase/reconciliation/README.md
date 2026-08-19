# Businesses UUID reconciliation package

These scripts are **not yet placed in `supabase/migrations/`** because the remote migration history and the owner mapping are not verified. They are controlled forward-only artifacts for staging review.

Run them only in this order:

1. `01_prepare_business_identity_reconciliation.sql`
2. Review and populate `public.business_identity_reconciliation.owner_user_id` using an administrative connection.
3. Back up the database and run `02_activate_businesses_uuid.sql` **before** the finance migration on a legacy-schema branch.
4. Regenerate Supabase types.
5. Validate migration replay, RLS, foreign keys, and application TypeScript.

If the finance migration has already been applied remotely, do not use these scripts; use a separate finance-applied repair branch based on the observed remote schema.
