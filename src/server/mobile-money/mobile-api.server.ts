import { createHash } from "node:crypto";
import { z } from "zod";

const PROVIDERS = ["mpesa", "airtel_money", "bank_sms", "other"] as const;
const MAX_BODY_BYTES = 64 * 1024;

const transactionSchema = z
  .object({
    accountId: z.string().uuid(),
    amount: z.number().finite().positive().max(1000000000000),
    occurredAt: z.string().datetime({ offset: true }),
    provider: z.enum(PROVIDERS),
    providerReference: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9_-]{1,100}$/)
      .optional(),
    direction: z.enum(["CREDIT", "DEBIT"]),
    transactionType: z.enum(["income", "expense"]),
    classificationConfirmed: z.literal(true),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.direction === "CREDIT" && value.transactionType !== "income") {
      context.addIssue({ code: "custom", message: "Classification does not match direction." });
    }
    if (value.direction === "DEBIT" && value.transactionType !== "expense") {
      context.addIssue({ code: "custom", message: "Classification does not match direction." });
    }
    if (Math.round(value.amount * 100) / 100 !== value.amount) {
      context.addIssue({ code: "custom", message: "Amount supports at most two decimals." });
    }
  });

const syncSchema = z
  .object({
    deviceId: z.string().uuid(),
    transactions: z.array(transactionSchema).min(1).max(20),
  })
  .strict();

const registerSchema = z
  .object({
    deviceLabel: z.string().trim().min(1).max(60),
    platform: z.enum(["android", "ios", "other"]),
  })
  .strict();

export type NormalizedMobileTransaction = z.infer<typeof transactionSchema>;

export type MobileStore = {
  registerDevice: (input: {
    userId: string;
    label: string;
    platform: "android" | "ios" | "other";
  }) => Promise<{ id: string } | null>;
  revokeDevice: (input: { userId: string; deviceId: string }) => Promise<boolean>;
  ingest: (input: {
    userId: string;
    deviceId: string;
    transaction: NormalizedMobileTransaction;
    fingerprint: string;
  }) => Promise<{ status: string; transactionId?: string }>;
};

export type MobileAuth = { userId: string; store: MobileStore };

export type MobileApiDependencies = {
  authenticate: (request: Request) => Promise<MobileAuth | null>;
};

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function readJson(request: Request): Promise<unknown | null> {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) return null;
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function fingerprint(userId: string, transaction: NormalizedMobileTransaction): string {
  const canonical = JSON.stringify({
    userId,
    accountId: transaction.accountId,
    amount: transaction.amount.toFixed(2),
    occurredAt: new Date(transaction.occurredAt).toISOString(),
    provider: transaction.provider,
    direction: transaction.direction,
    transactionType: transaction.transactionType,
  });
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function createMobileApi(dependencies: MobileApiDependencies) {
  async function authenticated(request: Request): Promise<MobileAuth | Response> {
    const header = request.headers.get("authorization");
    if (!header?.startsWith("Bearer ") || header.length <= 7) {
      return json({ ok: false, error: "unauthorized" }, 401);
    }
    try {
      const auth = await dependencies.authenticate(request);
      return auth ?? json({ ok: false, error: "unauthorized" }, 401);
    } catch {
      return json({ ok: false, error: "unauthorized" }, 401);
    }
  }

  return {
    async register(request: Request): Promise<Response> {
      const auth = await authenticated(request);
      if (auth instanceof Response) return auth;
      if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
        return json({ ok: false, error: "unsupported_media_type" }, 415);
      }
      const parsed = registerSchema.safeParse(await readJson(request));
      if (!parsed.success) return json({ ok: false, error: "invalid_request" }, 400);
      const device = await auth.store.registerDevice({
        userId: auth.userId,
        label: parsed.data.deviceLabel,
        platform: parsed.data.platform,
      });
      if (!device) return json({ ok: false, error: "registration_failed" }, 400);
      return json({ ok: true, deviceId: device.id }, 201);
    },

    async revoke(request: Request, deviceId: string): Promise<Response> {
      const auth = await authenticated(request);
      if (auth instanceof Response) return auth;
      if (!z.string().uuid().safeParse(deviceId).success) {
        return json({ ok: false, error: "invalid_request" }, 400);
      }
      const revoked = await auth.store.revokeDevice({ userId: auth.userId, deviceId });
      if (!revoked) return json({ ok: false, error: "device_not_found" }, 404);
      return json({ ok: true, status: "revoked" });
    },

    async sync(request: Request): Promise<Response> {
      const auth = await authenticated(request);
      if (auth instanceof Response) return auth;
      if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
        return json({ ok: false, error: "unsupported_media_type" }, 415);
      }
      const parsed = syncSchema.safeParse(await readJson(request));
      if (!parsed.success) return json({ ok: false, error: "invalid_request" }, 400);

      const results: Array<{ status: string; transactionId?: string }> = [];
      for (const transaction of parsed.data.transactions) {
        try {
          const result = await auth.store.ingest({
            userId: auth.userId,
            deviceId: parsed.data.deviceId,
            transaction,
            fingerprint: fingerprint(auth.userId, transaction),
          });
          results.push(result);
        } catch {
          results.push({ status: "unavailable" });
        }
      }

      const invalidDevice = results.some((result) => result.status === "invalid_device");
      if (invalidDevice) return json({ ok: false, error: "invalid_device" }, 403);
      const invalidAccount = results.some((result) => result.status === "invalid_account");
      if (invalidAccount) return json({ ok: false, error: "unauthorized_account" }, 403);
      const invalidScope = results.some((result) => result.status === "invalid_scope");
      if (invalidScope) return json({ ok: false, error: "unauthorized_business_scope" }, 403);
      if (results.some((result) => result.status === "invalid_payload")) {
        return json({ ok: false, error: "invalid_request" }, 400);
      }
      if (results.some((result) => result.status === "unauthorized")) {
        return json({ ok: false, error: "unauthorized" }, 401);
      }
      if (results.some((result) => result.status === "unavailable")) {
        return json({ ok: false, error: "sync_unavailable" }, 503);
      }
      return json({
        ok: true,
        results: results.map((result) => ({
          status: result.status,
          ...(result.transactionId ? { transactionId: result.transactionId } : {}),
        })),
      });
    },
  };
}
