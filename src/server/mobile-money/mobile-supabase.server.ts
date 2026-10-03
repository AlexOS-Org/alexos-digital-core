import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { MobileAuth, MobileStore, NormalizedMobileTransaction } from "./mobile-api.server";

type MobileDatabase = SupabaseClient<Database>;

function createUserClient(token: string): MobileDatabase | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function createStore(client: MobileDatabase): MobileStore {
  return {
    async registerDevice({ userId, label, platform }) {
      const { data, error } = await client
        .from("mobile_sync_devices")
        .insert({ user_id: userId, device_label: label, platform })
        .select("id")
        .single();
      if (error || !data) return null;
      return { id: data.id };
    },

    async revokeDevice({ deviceId }) {
      const { data, error } = await client.rpc("mobile_revoke_device", {
        p_device_id: deviceId,
      });
      return !error && data === true;
    },

    async ingest({ deviceId, transaction, fingerprint }) {
      const tx: NormalizedMobileTransaction = transaction;
      const { data, error } = await client.rpc("mobile_ingest_transaction", {
        p_device_id: deviceId,
        p_account_id: tx.accountId,
        p_provider: tx.provider,
        p_provider_reference: tx.providerReference ?? null,
        p_fingerprint: fingerprint,
        p_amount: tx.amount,
        p_occurred_at: tx.occurredAt,
        p_direction: tx.direction,
        p_transaction_type: tx.transactionType,
        p_classification_confirmed: tx.classificationConfirmed,
      });
      if (error || !data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Mobile transaction write failed");
      }
      const result = data as { status?: unknown; transaction_id?: unknown };
      return {
        status: typeof result.status === "string" ? result.status : "unavailable",
        ...(typeof result.transaction_id === "string"
          ? { transactionId: result.transaction_id }
          : {}),
      };
    },
  };
}

export async function authenticateMobileRequest(request: Request): Promise<MobileAuth | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token || token.split(".").length !== 3) return null;

  const client = createUserClient(token);
  if (!client) return null;

  // getUser verifies the token with Supabase Auth, including server-side session
  // state. A decoded or locally verified JWT alone is insufficient here.
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user?.id) return null;
  return { userId: data.user.id, store: createStore(client) };
}
