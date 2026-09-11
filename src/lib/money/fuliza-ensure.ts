import { supabase } from "@/integrations/supabase/client";
import {
  FULIZA_CATEGORY,
  isMpesaAccountName,
  planFulizaFees,
  type LedgerTx,
} from "./fuliza";
import { expenseTypeForCategory } from "./constants";

/**
 * For each active M-Pesa account with balance < 0, post any missing
 * Fuliza access / daily fee expenses (idempotent by reference).
 * Safe to call on accounts page load.
 */
export async function ensureMpesaFulizaCharges(): Promise<{ posted: number }> {
  const { data: accounts, error: accErr } = await supabase
    .from("accounts")
    .select("id,name,opening_balance,status,currency,financial_scope,business_id,business_name")
    .eq("status", "active")
    .is("deleted_at", null);
  if (accErr) throw accErr;

  const mpesaAccounts = (accounts ?? []).filter((a) => isMpesaAccountName(a.name));
  if (mpesaAccounts.length === 0) return { posted: 0 };

  const { data: balances, error: balErr } = await supabase.from("account_balances").select("*");
  if (balErr) throw balErr;
  const balMap = new Map((balances ?? []).map((b) => [b.account_id, Number(b.balance ?? 0)]));

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { posted: 0 };

  let posted = 0;
  const now = new Date().toISOString();

  for (const account of mpesaAccounts) {
    const balance = balMap.get(account.id) ?? Number(account.opening_balance ?? 0);
    if (balance >= 0) continue;

    const { data: txs, error: txErr } = await supabase
      .from("transactions")
      .select(
        "type,amount,account_id,transfer_account_id,status,deleted_at,occurred_at,reference",
      )
      .or(`account_id.eq.${account.id},transfer_account_id.eq.${account.id}`)
      .is("deleted_at", null)
      .order("occurred_at", { ascending: true })
      .limit(500);
    if (txErr) throw txErr;

    const planned = planFulizaFees({
      accountId: account.id,
      accountName: account.name,
      openingBalance: Number(account.opening_balance ?? 0),
      currentBalance: balance,
      txs: (txs ?? []) as LedgerTx[],
    });

    for (const fee of planned) {
      const { error } = await supabase.from("transactions").insert({
        user_id: userId,
        occurred_at: now,
        type: "expense",
        account_id: account.id,
        transfer_account_id: null,
        category: FULIZA_CATEGORY,
        source: null,
        description: fee.description,
        reference: fee.reference,
        amount: fee.amount,
        business_id: account.business_id ?? null,
        financial_scope: account.financial_scope ?? "personal",
        business_name: account.business_name ?? null,
        income_type: null,
        expense_type: expenseTypeForCategory(FULIZA_CATEGORY),
        expense_scope: account.financial_scope === "business" ? "business" : "personal",
        attachment_url: null,
        status: "posted",
      } as never);
      if (error) {
        if (String(error.message ?? "").toLowerCase().includes("duplicate")) continue;
        throw error;
      }
      posted += 1;
    }
  }

  return { posted };
}
