import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../../supabase/migrations/20261003113001_mobile_money_sync.sql", import.meta.url),
  "utf8",
);

describe("mobile money database security contract", () => {
  it("enables owner-scoped RLS and exposes no permissive policies", () => {
    expect(migration).toMatch(/alter table public\.mobile_sync_devices enable row level security/i);
    expect(migration).toMatch(/auth\.uid\(\)\) = user_id/i);
    expect(migration).not.toMatch(/using\s*\(\s*true\s*\)|with check\s*\(\s*true\s*\)/i);
    expect(migration).toMatch(/revoke update, delete on public\.mobile_sync_devices/i);
  });

  it("makes both deduplication keys unique at the database level", () => {
    expect(migration).toMatch(
      /create unique index transactions_mobile_provider_reference_unique[\s\S]*?where mobile_provider is not null and mobile_provider_reference is not null/i,
    );
    expect(migration).toMatch(
      /create unique index transactions_mobile_fingerprint_unique[\s\S]*?where mobile_provider is not null and mobile_provider_reference is null/i,
    );
    expect(migration).toMatch(/on conflict do nothing/i);
  });

  it("keeps ingestion invoker-scoped and the only definer function owner-limited", () => {
    expect(migration).toMatch(
      /function public\.mobile_ingest_transaction\([\s\S]*?security invoker/i,
    );
    expect(migration).toMatch(
      /function public\.mobile_revoke_device\([\s\S]*?security definer[\s\S]*?where id = p_device_id\s+and user_id = \(select auth\.uid\(\)\)[\s\S]*?and revoked_at is null/i,
    );
    expect(migration).toMatch(
      /revoke all on function public\.mobile_ingest_transaction[\s\S]*?from public, anon/i,
    );
  });

  it("writes only to the canonical transaction table and persists no SMS content", () => {
    expect(migration).toMatch(/insert into public\.transactions/i);
    expect(migration).not.toMatch(/raw_sms|sms_body|inbox_contents/i);
  });

  it("checks account ownership and business ownership from the authenticated database identity", () => {
    expect(migration).toMatch(
      /from public\.accounts[\s\S]*?where id = p_account_id\s+and user_id = v_user_id/i,
    );
    expect(migration).toMatch(
      /from public\.businesses[\s\S]*?where id = v_business_id\s+and user_id = v_user_id\s+and status = 'active'/i,
    );
    expect(migration).toMatch(/v_user_id uuid := \(select auth\.uid\(\)\)/i);
  });
});
