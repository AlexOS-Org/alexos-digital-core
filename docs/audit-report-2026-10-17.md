# AlexOS Master Repository Audit — 2026-10-17

## Repositories audited

- Digital Core: `AlexOS-Org/alexos-digital-core`
- Android Mobile: `AlexOS-Org/alexos-mobile`

## Confirmed baseline

### Digital Core

- `main` was aligned with `origin/main` at `da6543959ecaed6133a259c9e4080d92515e9f7b`.
- Local verification passed: **69 test files, 407 tests**.
- Build, protected-public-file guard, and Cloudflare-only deployment guard passed.
- Production dependency audit did not report production vulnerabilities.
- Open Core PRs #114–#117 remain reviewable; PRs #119 and #120 are open and all observed checks passed.
- PR #119 addresses the TanStack Start security advisory.
- PR #120 addresses the two banking trigger functions with mutable search paths.

### Android Mobile

- `main` is aligned with `origin/main` at `5f93b301572f28aa9c8ab0a75fbddfa7c05f927d`.
- Android PR #9 is open and clean: release builds fail safely when required API configuration is missing.
- Release workflow validates signing secrets, restores the keystore in a temporary protected path, builds APK/AAB artifacts, hashes them, uploads them, and attests provenance.
- `gradlew` is executable and the repository contains unit and instrumentation tests for SMS parsing, payloads, local candidate storage, device state, and session storage.
- Local Gradle verification was blocked by the sandbox environment: no Android SDK location was available (`ANDROID_HOME`/`local.properties`). No Android build or physical-device result is claimed.

## Safe fix implemented

Money Center Accounts previously defaulted failed account and balance queries to empty arrays. This could present an account-query failure as “No accounts found” or silently show incomplete balances.

The branch adds generic user-facing error states without exposing backend details or changing financial calculations, persistence, schema, RLS, or payment behavior.

## Blocked or deferred findings

Supabase security advisors still report:

- Leaked-password protection disabled.
- Mutable search paths on `banking_growth_set_updated_at` and `banking_growth_phase3_set_updated_at`.
- Authenticated execution of `mobile_revoke_device(uuid)` as a `SECURITY DEFINER` function.

These require Auth, database, or RLS changes and are not modified by this safe frontend-only audit.

Android physical-device installation, real SMS reception, release signing verification, and end-to-end mobile synchronization remain unverified in this environment.

## Validation

The Digital Core baseline passed before the change. The feature branch must pass the complete verification gate before publication. No production resources, hosted configuration, schema, migrations, financial data, payments, storefront behavior, or Android signing configuration were changed.
