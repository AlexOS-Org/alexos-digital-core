import {
  initiateStkPush,
  normalizeKenyaMsisdn,
  parseStkCallback,
  readDarajaEnv,
  statusFromResultCode,
} from "./daraja";

function digitsOnly(value: string): string {
  return String(value ?? "").replace(/\D/g, "");
}

function phonesMatch(a: string, b: string): boolean {
  const na = normalizeKenyaMsisdn(a) ?? digitsOnly(a);
  const nb = normalizeKenyaMsisdn(b) ?? digitsOnly(b);
  if (!na || !nb) return false;
  return na === nb || na.endsWith(nb.slice(-9)) || nb.endsWith(na.slice(-9));
}

export async function initiateOrderStkPush(input: {
  orderNumber: string;
  phone: string;
}): Promise<
  | {
      ok: true;
      checkoutRequestId: string;
      merchantRequestId: string;
      customerMessage: string;
      amount: number;
      phone: string;
      attemptId: string;
      configured: true;
    }
  | { ok: false; error: string; status: number; configured?: boolean }
> {
  const env = readDarajaEnv();
  if (!env) {
    return {
      ok: false,
      error: "M-Pesa STK is not configured yet. Use Paybill instructions instead.",
      status: 503,
      configured: false,
    };
  }

  const orderNumber = String(input.orderNumber ?? "").trim().toUpperCase();
  const phone = normalizeKenyaMsisdn(input.phone);
  if (!orderNumber) return { ok: false, error: "Order number is required.", status: 400 };
  if (!phone) {
    return {
      ok: false,
      error: "Enter a valid Safaricom M-Pesa number (07… or 2547…).",
      status: 400,
    };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: order, error: orderError } = await supabaseAdmin
    .from("dg_orders")
    .select("id,order_number,total,currency,payment_status,payment_method,customer_id,deleted_at")
    .eq("order_number", orderNumber)
    .is("deleted_at", null)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!order) return { ok: false, error: "Order not found.", status: 404 };

  const { data: customer } = await supabaseAdmin
    .from("dg_customers")
    .select("phone")
    .eq("id", order.customer_id ?? "")
    .maybeSingle();

  const orderPhone = customer?.phone ?? "";
  if (!phonesMatch(orderPhone, phone)) {
    return {
      ok: false,
      error: "Phone number does not match this order.",
      status: 403,
    };
  }

  if (order.payment_status === "paid") {
    return { ok: false, error: "This order is already marked paid.", status: 409 };
  }

  const amount = Math.round(Number(order.total ?? 0));
  if (!Number.isFinite(amount) || amount < 1) {
    return { ok: false, error: "Order total is invalid for STK.", status: 400 };
  }

  const { data: attempt, error: insertError } = await supabaseAdmin
    .from("dg_mpesa_stk_attempts" as never)
    .insert({
      order_id: order.id,
      order_number: order.order_number,
      phone,
      amount,
      currency: order.currency ?? "KES",
      account_reference: order.order_number.slice(0, 12),
      transaction_desc: "DailyGear",
      status: "initiated",
    } as never)
    .select("id")
    .single();

  if (insertError) throw insertError;
  const attemptId = (attempt as { id: string }).id;

  const result = await initiateStkPush(env, {
    amount,
    phone,
    accountReference: order.order_number,
    transactionDesc: "DailyGear order",
  });

  if (!result.ok) {
    await supabaseAdmin
      .from("dg_mpesa_stk_attempts" as never)
      .update({
        status: "failed",
        error_message: result.error,
        raw_initiate: result.raw ?? null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", attemptId);
    return { ok: false, error: result.error, status: 502 };
  }

  await supabaseAdmin
    .from("dg_mpesa_stk_attempts" as never)
    .update({
      status: "pending",
      merchant_request_id: result.data.MerchantRequestID,
      checkout_request_id: result.data.CheckoutRequestID,
      raw_initiate: result.data,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", attemptId);

  return {
    ok: true,
    checkoutRequestId: result.data.CheckoutRequestID,
    merchantRequestId: result.data.MerchantRequestID,
    customerMessage: result.data.CustomerMessage,
    amount,
    phone,
    attemptId,
    configured: true,
  };
}

export async function handleStkCallback(rawBody: unknown): Promise<{ ok: true; status: string }> {
  const parsed = parseStkCallback(rawBody);
  if (!parsed.checkoutRequestId && !parsed.merchantRequestId) {
    return { ok: true, status: "ignored" };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const status = statusFromResultCode(parsed.resultCode);

  let query = supabaseAdmin.from("dg_mpesa_stk_attempts" as never).select("id,status");
  if (parsed.checkoutRequestId) {
    query = query.eq("checkout_request_id", parsed.checkoutRequestId);
  } else {
    query = query.eq("merchant_request_id", parsed.merchantRequestId!);
  }

  const { data: existing } = await query.maybeSingle();
  if (!existing) {
    console.warn("[mpesa] callback for unknown checkout", parsed.checkoutRequestId);
    return { ok: true, status: "unknown_attempt" };
  }

  const row = existing as { id: string; status: string };
  // Idempotent: do not overwrite a terminal success
  if (row.status === "success") return { ok: true, status: "already_success" };

  await supabaseAdmin
    .from("dg_mpesa_stk_attempts" as never)
    .update({
      status,
      result_code: parsed.resultCode,
      result_desc: parsed.resultDesc,
      mpesa_receipt_number: parsed.receipt,
      callback_amount: parsed.amount,
      callback_phone: parsed.phone,
      transaction_date: parsed.transactionDate,
      raw_callback: rawBody,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", row.id);

  // Phase A: log only. Do not auto-call dg_confirm_order_payment.
  return { ok: true, status };
}

export async function getStkStatus(input: {
  orderNumber?: string;
  phone?: string;
  checkoutRequestId?: string;
}): Promise<{
  ok: boolean;
  status?: string;
  resultDesc?: string | null;
  receipt?: string | null;
  amount?: number | null;
  error?: string;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if (input.checkoutRequestId) {
    const { data } = await supabaseAdmin
      .from("dg_mpesa_stk_attempts" as never)
      .select("status,result_desc,mpesa_receipt_number,callback_amount,amount")
      .eq("checkout_request_id", input.checkoutRequestId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return { ok: false, error: "No STK attempt found." };
    const row = data as {
      status: string;
      result_desc: string | null;
      mpesa_receipt_number: string | null;
      callback_amount: number | null;
      amount: number;
    };
    return {
      ok: true,
      status: row.status,
      resultDesc: row.result_desc,
      receipt: row.mpesa_receipt_number,
      amount: row.callback_amount ?? row.amount,
    };
  }

  const orderNumber = String(input.orderNumber ?? "").trim().toUpperCase();
  const phone = input.phone ? normalizeKenyaMsisdn(input.phone) : null;
  if (!orderNumber || !phone) {
    return { ok: false, error: "orderNumber + phone or checkoutRequestId required." };
  }

  const { data: order } = await supabaseAdmin
    .from("dg_orders")
    .select("id,customer_id")
    .eq("order_number", orderNumber)
    .is("deleted_at", null)
    .maybeSingle();
  if (!order) return { ok: false, error: "Order not found." };

  const { data: customer } = await supabaseAdmin
    .from("dg_customers")
    .select("phone")
    .eq("id", order.customer_id ?? "")
    .maybeSingle();
  if (!phonesMatch(customer?.phone ?? "", phone)) {
    return { ok: false, error: "Phone number does not match this order." };
  }

  const { data } = await supabaseAdmin
    .from("dg_mpesa_stk_attempts" as never)
    .select("status,result_desc,mpesa_receipt_number,callback_amount,amount")
    .eq("order_number", orderNumber)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return { ok: true, status: "none" };
  const row = data as {
    status: string;
    result_desc: string | null;
    mpesa_receipt_number: string | null;
    callback_amount: number | null;
    amount: number;
  };
  return {
    ok: true,
    status: row.status,
    resultDesc: row.result_desc,
    receipt: row.mpesa_receipt_number,
    amount: row.callback_amount ?? row.amount,
  };
}
