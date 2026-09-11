/**
 * Safaricom Daraja M-Pesa Express (STK Push) client.
 * Secrets stay server-side only. Phase A: initiate + query helpers.
 */

export type DarajaEnv = {
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortcode: string;
  /** sandbox | production */
  environment: "sandbox" | "production";
  /** Public HTTPS callback Safaricom will POST to */
  callbackUrl: string;
  /** CustomerPayBillOnline | CustomerBuyGoodsOnline */
  transactionType: "CustomerPayBillOnline" | "CustomerBuyGoodsOnline";
};

export type StkPushInput = {
  amount: number;
  phone: string;
  accountReference: string;
  transactionDesc: string;
};

export type StkPushAccepted = {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
};

function baseUrl(env: DarajaEnv): string {
  return env.environment === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

export function readDarajaEnv(): DarajaEnv | null {
  const consumerKey = process.env.MPESA_CONSUMER_KEY?.trim();
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET?.trim();
  const passkey = process.env.MPESA_PASSKEY?.trim();
  const shortcode = process.env.MPESA_SHORTCODE?.trim();
  if (!consumerKey || !consumerSecret || !passkey || !shortcode) return null;

  const environment =
    process.env.MPESA_ENVIRONMENT?.trim().toLowerCase() === "production"
      ? "production"
      : "sandbox";

  const publicUrl = (
    process.env.DAILYGEAR_PUBLIC_URL?.trim() || "https://dailygear.co.ke"
  ).replace(/\/$/, "");
  const callbackUrl =
    process.env.MPESA_CALLBACK_URL?.trim() || `${publicUrl}/api/mpesa/callback`;

  const transactionType =
    process.env.MPESA_TRANSACTION_TYPE?.trim() === "CustomerBuyGoodsOnline"
      ? "CustomerBuyGoodsOnline"
      : "CustomerPayBillOnline";

  return {
    consumerKey,
    consumerSecret,
    passkey,
    shortcode,
    environment,
    callbackUrl,
    transactionType,
  };
}

/** Kenya MSISDN → 2547XXXXXXXX */
export function normalizeKenyaMsisdn(raw: string): string | null {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return null;
  let n = digits;
  if (n.startsWith("0") && n.length === 10) n = `254${n.slice(1)}`;
  else if (n.startsWith("7") && n.length === 9) n = `254${n}`;
  else if (n.startsWith("254") && n.length === 12) {
    /* ok */
  } else if (n.startsWith("2540") && n.length === 13) n = `254${n.slice(4)}`;
  else return null;
  if (!/^2547\d{8}$/.test(n)) return null;
  return n;
}

function timestampNow(): string {
  const d = new Date();
  const p = (v: number) => String(v).padStart(2, "0");
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
}

function stkPassword(shortcode: string, passkey: string, timestamp: string): string {
  const raw = `${shortcode}${passkey}${timestamp}`;
  return btoa(raw);
}

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getDarajaAccessToken(env: DarajaEnv): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) return cachedToken.value;

  const auth = btoa(`${env.consumerKey}:${env.consumerSecret}`);
  const res = await fetch(
    `${baseUrl(env)}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Daraja OAuth failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { access_token?: string; expires_in?: string };
  if (!data.access_token) throw new Error("Daraja OAuth returned no access_token.");
  const expiresInSec = Number(data.expires_in ?? 3599);
  cachedToken = {
    value: data.access_token,
    expiresAt: now + Math.max(60, expiresInSec - 60) * 1000,
  };
  return data.access_token;
}

export async function initiateStkPush(
  env: DarajaEnv,
  input: StkPushInput,
): Promise<{ ok: true; data: StkPushAccepted } | { ok: false; error: string; raw?: unknown }> {
  const phone = normalizeKenyaMsisdn(input.phone);
  if (!phone) return { ok: false, error: "Enter a valid Safaricom number (07… or 2547…)." };

  const amount = Math.round(Number(input.amount));
  if (!Number.isFinite(amount) || amount < 1) {
    return { ok: false, error: "Amount must be at least KES 1." };
  }

  const timestamp = timestampNow();
  const password = stkPassword(env.shortcode, env.passkey, timestamp);
  const token = await getDarajaAccessToken(env);

  const payload = {
    BusinessShortCode: env.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: env.transactionType,
    Amount: amount,
    PartyA: phone,
    PartyB: env.shortcode,
    PhoneNumber: phone,
    CallBackURL: env.callbackUrl,
    AccountReference: input.accountReference.slice(0, 12),
    TransactionDesc: input.transactionDesc.slice(0, 13),
  };

  const res = await fetch(`${baseUrl(env)}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.json().catch(() => null);
  if (!res.ok) {
    return {
      ok: false,
      error: `STK request failed (${res.status}).`,
      raw,
    };
  }

  const data = raw as StkPushAccepted & { errorCode?: string; errorMessage?: string };
  if (data.ResponseCode !== "0" || !data.CheckoutRequestID) {
    return {
      ok: false,
      error: data.ResponseDescription || data.errorMessage || "STK push was not accepted.",
      raw,
    };
  }

  return { ok: true, data };
}

export type StkCallbackBody = {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
      CallbackMetadata?: {
        Item?: Array<{ Name?: string; Value?: string | number }>;
      };
    };
  };
};

export function parseStkCallback(body: unknown): {
  merchantRequestId: string | null;
  checkoutRequestId: string | null;
  resultCode: number | null;
  resultDesc: string | null;
  receipt: string | null;
  amount: number | null;
  phone: string | null;
  transactionDate: string | null;
} {
  const cb = (body as StkCallbackBody)?.Body?.stkCallback;
  const items = cb?.CallbackMetadata?.Item ?? [];
  const byName = (name: string) =>
    items.find((i) => (i.Name ?? "").toLowerCase() === name.toLowerCase())?.Value ?? null;

  const amountRaw = byName("Amount");
  const phoneRaw = byName("PhoneNumber");

  return {
    merchantRequestId: cb?.MerchantRequestID ?? null,
    checkoutRequestId: cb?.CheckoutRequestID ?? null,
    resultCode: typeof cb?.ResultCode === "number" ? cb.ResultCode : null,
    resultDesc: cb?.ResultDesc ?? null,
    receipt: byName("MpesaReceiptNumber") != null ? String(byName("MpesaReceiptNumber")) : null,
    amount: amountRaw != null && Number.isFinite(Number(amountRaw)) ? Number(amountRaw) : null,
    phone: phoneRaw != null ? String(phoneRaw) : null,
    transactionDate: byName("TransactionDate") != null ? String(byName("TransactionDate")) : null,
  };
}

export function statusFromResultCode(
  code: number | null,
): "success" | "failed" | "cancelled" | "timeout" {
  if (code === 0) return "success";
  if (code === 1032) return "cancelled";
  if (code === 1037) return "timeout";
  return "failed";
}
