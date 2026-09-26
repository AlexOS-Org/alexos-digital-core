import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { computeWeeklyFinancials, getWeekBoundaries } from "@/lib/reports/weekly-performance";
import type { Account, Expected, Transaction } from "@/lib/money/api";

const CRON = "0 17 * * 6";

type WeeklyPreference = { user_id: string; last_sent_period: string | null };

type UserRecord = { email?: string | null; user_metadata?: { full_name?: string; name?: string } };

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ??
      character,
  );
}

function money(value: number | null, currency: string | null): string {
  if (value === null) return "Unavailable";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currency || "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

function comparison(
  current: number | null,
  previous: number | null,
  currency: string | null,
): string {
  if (current === null || previous === null) return "Unavailable versus last week";
  const difference = current - previous;
  const percentage =
    previous === 0 ? (current === 0 ? 0 : null) : (difference / Math.abs(previous)) * 100;
  const change =
    percentage === null ? "new activity" : `${difference > 0 ? "+" : ""}${percentage.toFixed(0)}%`;
  return `${money(previous, currency)} (${change})`;
}

function renderEmail(input: {
  name: string;
  periodLabel: string;
  range: string;
  currency: string | null;
  current: ReturnType<typeof computeWeeklyFinancials>;
  previous: ReturnType<typeof computeWeeklyFinancials>;
}): { subject: string; html: string; text: string } {
  const { name, periodLabel, range, currency, current, previous } = input;
  const netChange =
    current.netCashFlow !== null && previous.netCashFlow !== null
      ? current.netCashFlow - previous.netCashFlow
      : null;
  const expenseChange =
    current.expenses !== null && previous.expenses !== null
      ? current.expenses - previous.expenses
      : null;
  const improved =
    netChange !== null && netChange >= 0 && (expenseChange === null || expenseChange <= 0);
  const pulse = improved ? "Performance improved" : "Performance needs attention";
  const detail =
    netChange === null
      ? "More posted activity is needed to compare this week with last week."
      : `${netChange >= 0 ? "Net cash flow improved" : "Net cash flow declined"} by ${money(Math.abs(netChange), currency)} versus last week${expenseChange === null ? "." : `, while expenditure ${expenseChange <= 0 ? "fell" : "rose"} by ${money(Math.abs(expenseChange), currency)}.`}`;
  const score =
    current.netCashFlow === null
      ? 0
      : Math.min(
          100,
          (current.netCashFlow >= 0 ? 50 : 25) +
            (previous.netCashFlow !== null && current.netCashFlow >= previous.netCashFlow
              ? 20
              : 0) +
            (current.expenses !== null &&
            previous.expenses !== null &&
            current.expenses <= previous.expenses
              ? 20
              : 0) +
            (current.transactionCount > 0 ? 10 : 0),
        );

  const rows = [
    [
      "Cash inflow",
      money(current.income, currency),
      comparison(current.income, previous.income, currency),
    ],
    [
      "Expenditure",
      money(current.expenses, currency),
      comparison(current.expenses, previous.expenses, currency),
    ],
    [
      "Net cash flow",
      money(current.netCashFlow, currency),
      comparison(current.netCashFlow, previous.netCashFlow, currency),
    ],
  ];
  const htmlRows = rows
    .map(
      ([label, value, compare]) =>
        `<tr><td style="padding:14px 0;border-bottom:1px solid #e2e8f0;color:#475569">${label}</td><td style="padding:14px 0;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;color:#0f172a">${value}<br><span style="font-size:12px;font-weight:400;color:#64748b">vs last week: ${compare}</span></td></tr>`,
    )
    .join("");
  const safeName = escapeHtml(name || "there");
  const safePulse = escapeHtml(pulse);
  const safeDetail = escapeHtml(detail);
  const subject = `Money Center weekly report: ${pulse}`;
  const text = `Hi ${name || "there"},\n\n${periodLabel} (${range})\nPerformance score: ${score}/100\n${pulse}: ${detail}\n\nCash inflow: ${rows[0][1]} — vs last week ${rows[0][2]}\nExpenditure: ${rows[1][1]} — vs last week ${rows[1][2]}\nNet cash flow: ${rows[2][1]} — vs last week ${rows[2][2]}\n\nOpen Money Center: ${process.env.DAILYGEAR_PUBLIC_URL || "https://dailygear.co.ke"}/money-center`;
  const html = `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:620px;margin:0 auto;padding:32px 18px"><div style="border-radius:24px;background:linear-gradient(135deg,#020617,#1e3a8a);padding:28px;color:#fff"><div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#a7f3d0">Money Center</div><h1 style="margin:12px 0 4px;font-size:28px">Weekly performance report</h1><p style="margin:0;color:#bfdbfe">${escapeHtml(periodLabel)} · ${escapeHtml(range)}</p></div><div style="margin-top:16px;border-radius:20px;background:#fff;padding:24px;border:1px solid #e2e8f0"><p>Hi ${safeName},</p><div style="border-radius:14px;padding:16px;background:${improved ? "#ecfdf5" : "#fffbeb"};border:1px solid ${improved ? "#a7f3d0" : "#fde68a"}"><strong>${safePulse}</strong><p style="margin:6px 0 0;color:#475569;font-size:14px">${safeDetail}</p></div><div style="margin-top:18px;border-radius:14px;background:#0f172a;color:#fff;padding:16px"><div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Performance score</div><div style="font-size:36px;font-weight:700;margin-top:5px">${score}<span style="font-size:14px;color:#94a3b8"> / 100</span></div></div><table style="width:100%;border-collapse:collapse;margin-top:12px">${htmlRows}</table><a href="${escapeHtml(process.env.DAILYGEAR_PUBLIC_URL || "https://dailygear.co.ke")}/money-center" style="display:inline-block;margin-top:22px;padding:12px 16px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none;font-weight:700">Open Money Center</a></div><p style="font-size:12px;color:#64748b;text-align:center">This weekly report uses posted Money Center activity and is sent every Saturday at 8:00 PM EAT.</p></div></body></html>`;
  return { subject, html, text };
}

export async function sendWeeklyMoneySummaries() {
  if (!process.env.RESEND_API_KEY || !process.env.DAILYGEAR_EMAIL_FROM) {
    return { sent: 0, skipped: "email_not_configured" } as const;
  }
  const period = getWeekBoundaries(new Date(), 0);
  const previous = getWeekBoundaries(new Date(), -1);
  const { data: preferences, error: preferenceError } = await supabaseAdmin
    .from("money_weekly_summary_preferences" as never)
    .select("user_id,last_sent_period")
    .eq("enabled", true)
    .limit(100);
  if (preferenceError) throw preferenceError;

  let sent = 0;
  let skipped = 0;
  for (const preference of (preferences ?? []) as unknown as WeeklyPreference[]) {
    if (preference.last_sent_period === period.from) {
      skipped += 1;
      continue;
    }
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      preference.user_id,
    );
    if (userError || !userData.user?.email) {
      skipped += 1;
      continue;
    }
    const [
      { data: transactions, error: transactionsError },
      { data: accounts, error: accountsError },
      { data: expected, error: expectedError },
    ] = await Promise.all([
      supabaseAdmin
        .from("transactions")
        .select("*")
        .eq("user_id", preference.user_id)
        .is("deleted_at", null)
        .limit(5000),
      supabaseAdmin
        .from("accounts")
        .select("*")
        .eq("user_id", preference.user_id)
        .eq("status", "active")
        .is("deleted_at", null)
        .limit(100),
      supabaseAdmin
        .from("expected_money")
        .select("*")
        .eq("user_id", preference.user_id)
        .is("deleted_at", null)
        .limit(1000),
    ]);
    if (transactionsError || accountsError || expectedError)
      throw transactionsError || accountsError || expectedError;
    const typedTransactions = (transactions ?? []) as unknown as Transaction[];
    const typedAccounts = (accounts ?? []) as unknown as Account[];
    const typedExpected = (expected ?? []) as unknown as Expected[];
    const current = computeWeeklyFinancials(
      typedTransactions,
      typedAccounts,
      typedExpected,
      period.from,
      period.until,
    );
    const prior = computeWeeklyFinancials(
      typedTransactions,
      typedAccounts,
      typedExpected,
      previous.from,
      previous.until,
    );
    const user = userData.user as UserRecord;
    const recipientEmail = user.email;
    if (!recipientEmail) {
      skipped += 1;
      continue;
    }
    const content = renderEmail({
      name:
        user.user_metadata?.full_name || user.user_metadata?.name || recipientEmail.split("@")[0],
      periodLabel: period.label,
      range: period.formattedRange,
      currency: current.currency,
      current,
      previous: prior,
    });
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.DAILYGEAR_EMAIL_FROM,
        to: [recipientEmail],
        subject: content.subject,
        html: content.html,
        text: content.text,
        ...(process.env.RESEND_REPLY_TO_EMAIL
          ? { reply_to: process.env.RESEND_REPLY_TO_EMAIL }
          : {}),
      }),
    });
    if (!response.ok)
      throw new Error(
        `Weekly summary email failed (${response.status}): ${(await response.text()).slice(0, 300)}`,
      );
    const { error: updateError } = await supabaseAdmin
      .from("money_weekly_summary_preferences" as never)
      .update({ last_sent_period: period.from, updated_at: new Date().toISOString() } as never)
      .eq("user_id", preference.user_id);
    if (updateError) throw updateError;
    sent += 1;
  }
  return { sent, skipped, period: period.from } as const;
}

export { CRON as WEEKLY_MONEY_SUMMARY_CRON };
