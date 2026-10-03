import { describe, expect, it, vi } from "vitest";
import {
  createMobileApi,
  type MobileStore,
  type NormalizedMobileTransaction,
} from "./mobile-api.server";

const USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const DEVICE_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ACCOUNT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const DESTINATION_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const SECOND_DESTINATION_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

function transaction(overrides: Record<string, unknown> = {}) {
  return {
    accountId: ACCOUNT_ID,
    amount: 125.5,
    occurredAt: "2026-09-30T10:11:12+03:00",
    provider: "mpesa",
    providerReference: "QW12345ABC",
    direction: "CREDIT",
    transactionType: "income",
    classificationConfirmed: true,
    ...overrides,
  };
}

function request(body: unknown, token = "valid.jwt.token") {
  return new Request("https://example.test/api/mobile/transactions/sync", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function memoryStore(overrides: Partial<MobileStore> = {}) {
  const ledger: Array<Record<string, unknown>> = [];
  const fingerprints = new Map<
    string,
    { status: string; transactionId: string; fingerprint: string }
  >();
  const references = new Map<
    string,
    { status: string; transactionId: string; fingerprint: string }
  >();
  const store: MobileStore = {
    registerDevice: vi.fn(async () => ({ id: DEVICE_ID })),
    revokeDevice: vi.fn(async () => true),
    ingest: vi.fn(async ({ userId, deviceId, transaction: tx, fingerprint }) => {
      if (deviceId !== DEVICE_ID) return { status: "invalid_device" };
      if (tx.accountId !== ACCOUNT_ID) return { status: "invalid_account" };
      if ((tx as NormalizedMobileTransaction & { businessId?: string }).businessId) {
        return { status: "invalid_scope" };
      }
      const key = `${userId}:${tx.provider}:${tx.providerReference ?? fingerprint}`;
      const previous = tx.providerReference ? references.get(key) : fingerprints.get(key);
      if (previous) {
        if (tx.providerReference && previous.fingerprint !== fingerprint) {
          return { status: "duplicate_conflict" };
        }
        return { status: "duplicate", transactionId: previous.transactionId };
      }
      const transactionId = `ledger-${ledger.length + 1}`;
      ledger.push({
        id: transactionId,
        user_id: userId,
        account_id: tx.accountId,
        transfer_account_id: tx.transferAccountId ?? null,
        type: tx.transactionType,
        amount: tx.amount,
        occurred_at: new Date(tx.occurredAt).toISOString(),
        source: "mobile_money_sync",
        mobile_device_id: deviceId,
        mobile_provider: tx.provider,
        mobile_provider_reference: tx.providerReference ?? null,
        mobile_fingerprint: fingerprint,
      });
      const record = { status: "inserted", transactionId, fingerprint };
      if (tx.providerReference) references.set(key, record);
      else fingerprints.set(key, record);
      return { status: "inserted", transactionId };
    }),
    ...overrides,
  };
  return { store, ledger };
}

function makeApi(store: MobileStore, userId = USER_ID) {
  return createMobileApi({
    authenticate: vi.fn(async () => ({ userId, store })),
  });
}

describe("mobile money sync API", () => {
  it("rejects unauthenticated requests", async () => {
    const { store } = memoryStore();
    const api = createMobileApi({ authenticate: vi.fn(async () => null) });
    const response = await api.sync(
      request({ deviceId: DEVICE_ID, transactions: [transaction()] }, ""),
    );
    expect(response.status).toBe(401);
    expect(store.ingest).not.toHaveBeenCalled();
  });

  it("rejects invalid payloads, including extra raw SMS fields", async () => {
    const { store } = memoryStore();
    const api = makeApi(store);
    const response = await api.sync(
      request({
        deviceId: DEVICE_ID,
        transactions: [transaction({ rawSms: "secret inbox text" })],
      }),
    );
    expect(response.status).toBe(400);
    expect(store.ingest).not.toHaveBeenCalled();
  });

  it("rejects free-text fields that could carry source SMS", async () => {
    const { store } = memoryStore();
    const response = await makeApi(store).sync(
      request({
        deviceId: DEVICE_ID,
        transactions: [transaction({ description: "SMS body" })],
      }),
    );
    expect(response.status).toBe(400);
    expect(store.ingest).not.toHaveBeenCalled();
  });

  it.each(["invalid_device", "revoked_device"])("rejects %s safely", async (status) => {
    const { store } = memoryStore({
      ingest: vi.fn(async () => ({
        status: status === "revoked_device" ? "invalid_device" : status,
      })),
    });
    const response = await makeApi(store).sync(
      request({ deviceId: DEVICE_ID, transactions: [transaction()] }),
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ ok: false, error: "invalid_device" });
  });

  it("rejects accounts outside the authenticated user's scope", async () => {
    const { store } = memoryStore({ ingest: vi.fn(async () => ({ status: "invalid_account" })) });
    const response = await makeApi(store).sync(
      request({ deviceId: DEVICE_ID, transactions: [transaction()] }),
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ ok: false, error: "unauthorized_account" });
  });

  it("rejects unauthorized business scope without echoing the requested identifier", async () => {
    const { store } = memoryStore({ ingest: vi.fn(async () => ({ status: "invalid_scope" })) });
    const response = await makeApi(store).sync(
      request({ deviceId: DEVICE_ID, transactions: [transaction()] }),
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ ok: false, error: "unauthorized_business_scope" });
  });

  it("inserts a valid explicitly classified transaction into the canonical ledger", async () => {
    const { store, ledger } = memoryStore();
    const response = await makeApi(store).sync(
      request({ deviceId: DEVICE_ID, transactions: [transaction()] }),
    );
    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toEqual({
      ok: true,
      results: [{ status: "inserted", transactionId: "ledger-1" }],
    });
    expect(ledger).toHaveLength(1);
    expect(ledger[0]).toMatchObject({
      user_id: USER_ID,
      account_id: ACCOUNT_ID,
      type: "income",
      amount: 125.5,
      source: "mobile_money_sync",
      mobile_device_id: DEVICE_ID,
      mobile_provider: "mpesa",
    });
    expect(JSON.stringify(responseBody)).not.toContain("125.5");
  });

  it("returns duplicate for the same provider reference without creating a second ledger row", async () => {
    const { store, ledger } = memoryStore();
    const api = makeApi(store);
    const body = { deviceId: DEVICE_ID, transactions: [transaction()] };
    await api.sync(request(body));
    const response = await api.sync(request(body));
    expect((await response.json()).results).toEqual([
      { status: "duplicate", transactionId: "ledger-1" },
    ]);
    expect(ledger).toHaveLength(1);
  });

  it("makes retries without a provider reference idempotent by deterministic fingerprint", async () => {
    const { store, ledger } = memoryStore();
    const api = makeApi(store);
    const body = {
      deviceId: DEVICE_ID,
      transactions: [transaction({ providerReference: undefined })],
    };
    await api.sync(request(body));
    await api.sync(request(body));
    expect(ledger).toHaveLength(1);
    const first = vi.mocked(store.ingest).mock.calls[0]?.[0].fingerprint;
    const second = vi.mocked(store.ingest).mock.calls[1]?.[0].fingerprint;
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(second).toBe(first);
  });

  it("accepts a confirmed transfer with a distinct destination account", async () => {
    const { store, ledger } = memoryStore();
    const response = await makeApi(store).sync(
      request({
        deviceId: DEVICE_ID,
        transactions: [
          transaction({
            direction: "DEBIT",
            transactionType: "transfer",
            transferAccountId: DESTINATION_ID,
          }),
        ],
      }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).results).toEqual([
      { status: "inserted", transactionId: "ledger-1" },
    ]);
    expect(ledger[0]).toMatchObject({
      type: "transfer",
      transfer_account_id: DESTINATION_ID,
    });
  });

  it("requires a destination account for transfers", async () => {
    const { store } = memoryStore();
    const response = await makeApi(store).sync(
      request({
        deviceId: DEVICE_ID,
        transactions: [transaction({ transactionType: "transfer", transferAccountId: undefined })],
      }),
    );
    expect(response.status).toBe(400);
    expect(store.ingest).not.toHaveBeenCalled();
  });

  it("rejects transfers to the same source account", async () => {
    const { store } = memoryStore();
    const response = await makeApi(store).sync(
      request({
        deviceId: DEVICE_ID,
        transactions: [
          transaction({ transactionType: "transfer", transferAccountId: ACCOUNT_ID }),
        ],
      }),
    );
    expect(response.status).toBe(400);
    expect(store.ingest).not.toHaveBeenCalled();
  });

  it("rejects transfer accounts on income and expense transactions", async () => {
    const { store } = memoryStore();
    const response = await makeApi(store).sync(
      request({
        deviceId: DEVICE_ID,
        transactions: [transaction({ transferAccountId: DESTINATION_ID })],
      }),
    );
    expect(response.status).toBe(400);
    expect(store.ingest).not.toHaveBeenCalled();
  });

  it("rejects an unauthorized transfer destination", async () => {
    const { store } = memoryStore({
      ingest: vi.fn(async () => ({ status: "invalid_transfer_account" })),
    });
    const response = await makeApi(store).sync(
      request({
        deviceId: DEVICE_ID,
        transactions: [
          transaction({
            direction: "DEBIT",
            transactionType: "transfer",
            transferAccountId: DESTINATION_ID,
          }),
        ],
      }),
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      ok: false,
      error: "unauthorized_transfer_account",
    });
  });

  it("includes the transfer destination in the idempotency fingerprint", async () => {
    const { store } = memoryStore();
    const api = makeApi(store);
    await api.sync(
      request({
        deviceId: DEVICE_ID,
        transactions: [
          transaction({
            providerReference: undefined,
            direction: "DEBIT",
            transactionType: "transfer",
            transferAccountId: DESTINATION_ID,
          }),
        ],
      }),
    );
    await api.sync(
      request({
        deviceId: DEVICE_ID,
        transactions: [
          transaction({
            providerReference: undefined,
            direction: "DEBIT",
            transactionType: "transfer",
            transferAccountId: SECOND_DESTINATION_ID,
          }),
        ],
      }),
    );
    const first = vi.mocked(store.ingest).mock.calls[0]?.[0].fingerprint;
    const second = vi.mocked(store.ingest).mock.calls[1]?.[0].fingerprint;
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(second).toMatch(/^[a-f0-9]{64}$/);
    expect(second).not.toBe(first);
  });

  it("requires direction and explicit classification to agree", async () => {
    const { store } = memoryStore();
    const response = await makeApi(store).sync(
      request({
        deviceId: DEVICE_ID,
        transactions: [transaction({ direction: "DEBIT", transactionType: "income" })],
      }),
    );
    expect(response.status).toBe(400);
    expect(store.ingest).not.toHaveBeenCalled();
  });

  it("registers and revokes devices through authenticated store operations", async () => {
    const { store } = memoryStore();
    const api = makeApi(store);
    const registered = await api.register(
      new Request("https://example.test/api/mobile/devices", {
        method: "POST",
        headers: { Authorization: "Bearer valid.jwt.token", "Content-Type": "application/json" },
        body: JSON.stringify({ deviceLabel: "My phone", platform: "android" }),
      }),
    );
    expect(registered.status).toBe(201);
    expect(await registered.json()).toEqual({ ok: true, deviceId: DEVICE_ID });
    expect(store.registerDevice).toHaveBeenCalledWith({
      userId: USER_ID,
      label: "My phone",
      platform: "android",
    });
    const revoked = await api.revoke(
      new Request("https://example.test/api/mobile/devices", {
        method: "POST",
        headers: { Authorization: "Bearer valid.jwt.token" },
      }),
      DEVICE_ID,
    );
    expect(revoked.status).toBe(200);
    expect(store.revokeDevice).toHaveBeenCalledWith({ userId: USER_ID, deviceId: DEVICE_ID });
  });
});
