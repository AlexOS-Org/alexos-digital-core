# AlexOS / DailyGear Security Remediation Report

**Date:** 23 August 2026  
**Project:** `goafwbrayepaihxbqsse`  
**Repository:** `dylextrends/alexos-digital-core`  
**Mode:** Evidence-first production remediation

## Executive result

A narrow production remediation was completed through the Supabase connector. The two RLS-without-policy findings for server-only operational tables were resolved with explicit deny-by-default policies and revoked anon/authenticated table grants. The five `SECURITY DEFINER` findings were not “fixed” by blindly revoking authenticated execution because the application calls these functions for owner-admin payment, fulfilment, refund, and order-edit workflows. Instead, all five functions were hardened with `search_path = pg_catalog, public`, while their existing owner checks and authenticated grants were preserved.

The production security advisor now reports **six remaining findings**: five intentional authenticated `SECURITY DEFINER` execution warnings and the leaked-password-protection warning. The two RLS-without-policy findings are no longer present. The five remaining RPC findings require an application architecture change—such as private-schema server wrappers or a controlled service-side API—before authenticated execution can be revoked without breaking Money Center and DailyGear admin flows.

`FIRECRAWL_API_KEY` could not be added because the enabled Firecrawl connector provides connector-scoped research but does not expose its underlying credential for transfer into Cloudflare. No placeholder or invented key was added. The Firecrawl connector itself was verified with a successful read-only search.

## Changes applied

### 1. Server-only table lockdown

Applied migration `lock_server_only_tables` to production. It performs the following safe changes:

| Table                                | Access after remediation                                                                                    |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `public.auren_evidence_refresh_runs` | `anon` and `authenticated` table privileges revoked; explicit deny policies added; `service_role` retained. |
| `public.dg_cart_sessions`            | `anon` and `authenticated` table privileges revoked; explicit deny policies added; `service_role` retained. |

The application source uses the service-role server client for both tables. The post-migration privilege check confirmed `anon_select=false`, `anon_insert=false`, `authenticated_select=false`, `authenticated_insert=false`, while service-role select and insert remain true.

### 2. SECURITY DEFINER search-path hardening

Applied migration `harden_security_definer_search_paths` to production for these exact functions and overloads:

- `dg_confirm_order_payment`
- `dg_record_order_fulfilment` (both deployed overloads)
- `dg_refund_or_void_order_payment`
- `dg_update_admin_order`

Each now has `search_path=pg_catalog, public`. They remain `SECURITY DEFINER` and authenticated-executable because their current application call sites use them. Each function inspected includes authentication and owner-scoped order/account checks. The advisor still lists them because its rule detects authenticated execution of a `SECURITY DEFINER` function regardless of the strengthened search path.

## Current advisor status

| Finding                                                                                | Current status     | Safe disposition                                                                                                                                                                         |
| -------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RLS enabled without policy: `auren_evidence_refresh_runs`                              | Resolved           | Explicit deny policies plus revoked client grants.                                                                                                                                       |
| RLS enabled without policy: `dg_cart_sessions`                                         | Resolved           | Explicit deny policies plus revoked client grants.                                                                                                                                       |
| Authenticated `SECURITY DEFINER`: payment confirmation                                 | Remains as warning | Preserved intentionally; owner checks and safe search path verified.                                                                                                                     |
| Authenticated `SECURITY DEFINER`: fulfilment overload with advertising/supplier fields | Remains as warning | Preserved intentionally; owner checks and safe search path verified.                                                                                                                     |
| Authenticated `SECURITY DEFINER`: fulfilment overload                                  | Remains as warning | Preserved intentionally; owner checks and safe search path verified.                                                                                                                     |
| Authenticated `SECURITY DEFINER`: refund/void                                          | Remains as warning | Preserved intentionally; owner checks and safe search path verified.                                                                                                                     |
| Authenticated `SECURITY DEFINER`: admin order update                                   | Remains as warning | Preserved intentionally; owner checks and safe search path verified.                                                                                                                     |
| Leaked-password protection disabled                                                    | Remains as warning | Supabase documents this as an Auth Dashboard setting and states it is available on Pro and above; no supported Supabase connector operation was available to change it programmatically. |

## Why the five RPC grants were preserved

The repository directly calls the five functions from DailyGear server/application code. Revoking authenticated execution now would cause payment confirmation, order-cost entry, refunds/voids, or admin order editing to fail for the signed-in owner. Switching them to `SECURITY INVOKER` without first redesigning grants and RLS would also risk ledger or fulfilment failures. The safer remediation is to retain the existing business behavior, verify ownership checks, harden the search path, and schedule a separate private-schema wrapper migration with end-to-end authenticated tests.

The next architecture step is to expose only owner-checked server endpoints or private-schema wrappers using the service role, then revoke authenticated execution on the public RPCs after the application has been migrated and a non-production test branch is healthy. The existing Supabase branch inventory contained only the default `main` branch, which was marked `MIGRATIONS_FAILED`; no new paid branch was created.

## Firecrawl status

The enabled Firecrawl connector successfully completed a read-only search. However, its underlying API key is not available for safe extraction or transfer into Cloudflare. The Worker still intentionally requires `FIRECRAWL_API_KEY` before calling `https://api.firecrawl.dev/v2/search`. No value was guessed, copied from documentation, or written into source, logs, or Cloudflare.

To restore Worker-side public research, the real key must be added directly to the `alexos-business-os` Worker as an encrypted secret named `FIRECRAWL_API_KEY`. Once present, trigger or await one scheduled refresh and verify that Auren records `public_research=ok` or `partial` without logging the key.

## Safety boundary

No financial records, orders, payments, refunds, fulfilment records, stock quantities, product publication states, customer data, or account balances were changed. No production checkout was submitted. No secrets were printed or committed. The applied migrations are DDL-only privilege and function-configuration changes.

## Recommended next steps

1. Add the real Firecrawl key directly in Cloudflare Worker secrets.
2. Enable Supabase leaked-password protection from the project Auth settings if the plan supports it.
3. Build and test private server wrappers for the five owner-admin RPCs before revoking authenticated execution.
4. Add the missing HTTP security headers and HTTPS redirect identified by the live audit.
5. Run a signed-in owner-only regression test for payment confirmation, fulfilment costs, refund/void, and order editing after any RPC grant change.

## References

[1]: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy "Supabase database linter: RLS enabled without policy"
[2]: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable "Supabase database linter: authenticated SECURITY DEFINER function executable"
[3]: https://supabase.com/docs/guides/auth/password-security "Supabase password security and leaked-password protection"
[4]: https://docs.firecrawl.dev/introduction "Firecrawl API and search documentation"
