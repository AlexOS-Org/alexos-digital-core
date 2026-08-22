import { FileText, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Order } from "@/lib/dailygear/types";

interface Props {
  order: Order;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function openDocument(order: Order, kind: "invoice" | "receipt") {
  let payment: { amount: number; transaction_id: string; paid_at: string } | null = null;
  if (kind === "receipt") {
    const { data } = await supabase
      .from("dg_order_payments" as never)
      .select("amount, transaction_id, paid_at")
      .eq("order_id", order.id)
      .order("paid_at", { ascending: false })
      .limit(1);
    const rows = (data ?? []) as unknown as Array<{
      amount: number;
      transaction_id: string;
      paid_at: string;
    }>;
    payment = rows[0] ?? null;
  }
  const documentWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!documentWindow) return;
  const title = kind === "invoice" ? "Invoice" : "Receipt";
  documentWindow.document.write(
    `<!doctype html><html><head><title>${title} ${escapeHtml(order.order_number)}</title><style>body{font:15px/1.5 system-ui,sans-serif;color:#172033;max-width:760px;margin:48px auto;padding:0 24px}header{display:flex;justify-content:space-between;border-bottom:2px solid #172033;padding-bottom:20px;margin-bottom:28px}h1{margin:0;font-size:28px}dl{display:grid;grid-template-columns:160px 1fr;gap:8px 20px}dt{color:#64748b}dd{margin:0;font-weight:600}.total{font-size:22px;margin-top:28px;border-top:1px solid #cbd5e1;padding-top:16px}.muted{color:#64748b;font-size:13px}@media print{body{margin:0}}</style></head><body><header><div><h1>DailyGear</h1><div class="muted">${title}</div></div><div><strong>${escapeHtml(order.order_number)}</strong><div class="muted">${escapeHtml(new Date(order.placed_at).toLocaleDateString("en-KE"))}</div></div></header><dl><dt>Customer</dt><dd>${escapeHtml(order.customer_id ?? "—")}</dd><dt>Payment method</dt><dd>${escapeHtml(order.payment_method ?? "—")}</dd><dt>Order status</dt><dd>${escapeHtml(order.status)}</dd><dt>Payment status</dt><dd>${escapeHtml(order.payment_status)}</dd>${payment ? `<dt>Amount received</dt><dd>KES ${payment.amount.toLocaleString()}</dd><dt>Transaction ID</dt><dd>${escapeHtml(payment.transaction_id)}</dd><dt>Paid date</dt><dd>${escapeHtml(new Date(payment.paid_at).toLocaleString("en-KE"))}</dd>` : ""}</dl><div class="total">Total: KES ${Number(order.total ?? 0).toLocaleString()}</div><p class="muted">${kind === "receipt" ? "Payment recorded by DailyGear. Keep this receipt for your records." : "This invoice is generated from the DailyGear order record. It is not proof of payment."}</p><script>window.onload=()=>window.print()</script></body></html>`,
  );
  documentWindow.document.close();
}

export function OrderDocuments({ order }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        size="sm"
        variant="ghost"
        className="h-8 px-2 text-xs"
        onClick={() => void openDocument(order, "invoice")}
      >
        <FileText className="mr-1 h-3 w-3" /> Invoice
      </Button>
      {order.payment_status === "paid" && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={() => void openDocument(order, "receipt")}
        >
          <ReceiptText className="mr-1 h-3 w-3" /> Receipt
        </Button>
      )}
    </div>
  );
}
