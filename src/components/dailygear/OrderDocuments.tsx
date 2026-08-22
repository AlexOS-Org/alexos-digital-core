import { FileText, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Order } from "@/lib/dailygear/types";

interface Props {
  order: Order;
}

type CustomerRecord = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
};
type ItemRecord = { name: string; sku: string | null; quantity: number; total: number };
type PaymentRecord = {
  amount: number;
  transaction_id: string;
  paid_at: string;
  account_id: string;
};
type AccountRecord = { name: string };
type OrderDetails = { county: string | null; town: string | null; address: string | null };

function pdfEscape(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function createTextPdf(lines: string[]) {
  const safeLines = lines.map((line) => pdfEscape(line.slice(0, 115)));
  const commands = [
    "BT",
    "/F1 11 Tf",
    "50 760 Td",
    ...safeLines.flatMap((line, index) => [index ? "0 -16 Td" : "", `(${line}) Tj`]),
    "ET",
  ]
    .filter(Boolean)
    .join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets[index + 1] = pdf.length;
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function downloadPdf(
  order: Order,
  kind: "invoice" | "receipt",
  customer: CustomerRecord | null,
  items: ItemRecord[],
  payment: PaymentRecord | null,
  account: AccountRecord | null,
  details: OrderDetails | null,
) {
  const customerName =
    [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || "Walk-in customer";
  const lines = [
    "DAILYGEAR",
    kind === "invoice" ? "INVOICE" : "PAYMENT RECEIPT",
    `Order: ${order.order_number}`,
    `Date: ${new Date(order.placed_at).toLocaleDateString("en-KE")}`,
    "",
    `Customer: ${customerName}`,
    `Email: ${customer?.email || "—"}`,
    `Phone: ${customer?.phone || "—"}`,
    `Delivery: ${details?.county || "—"} — ${details?.town || "—"}`,
    `Address: ${details?.address || "—"}`,
    "",
    "ITEMS",
    ...(items.length
      ? items.map(
          (item) =>
            `${item.quantity} x ${item.name}${item.sku ? ` (${item.sku})` : ""} — KES ${Number(item.total).toLocaleString()}`,
        )
      : ["Order items are recorded in DailyGear."]),
    "",
    `Payment method: ${order.payment_method || "—"}`,
    `Payment status: ${order.payment_status}`,
    `TOTAL: KES ${Number(order.total ?? 0).toLocaleString()}`,
    ...(payment
      ? [
          "",
          `Amount received: KES ${Number(payment.amount).toLocaleString()}`,
          `Received into: ${account?.name || "Selected account"}`,
          `Transaction reference: ${payment.transaction_id}`,
          `Paid at: ${new Date(payment.paid_at).toLocaleString("en-KE")}`,
        ]
      : []),
    "",
    "M-PESA PAYMENT INSTRUCTIONS",
    "Paybill: 542542",
    "Account: 184545",
    `Amount: KES ${Number(order.total ?? 0).toLocaleString()}`,
    "Use the order number as your reference where supported. Send the M-Pesa code to DailyGear for confirmation.",
    "",
    kind === "receipt"
      ? "Payment recorded by DailyGear. Keep this receipt for your records."
      : "This invoice confirms the order details and is not proof of payment.",
  ];
  const blob = createTextPdf(lines);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${kind}-${order.order_number}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

async function openDocument(order: Order, kind: "invoice" | "receipt") {
  try {
    const [
      { data: customerData },
      { data: itemData },
      { data: paymentData },
      { data: detailData },
    ] = await Promise.all([
      order.customer_id
        ? supabase
            .from("dg_customers" as never)
            .select("first_name,last_name,email,phone")
            .eq("id", order.customer_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("dg_order_items" as never)
        .select("name,sku,quantity,total")
        .eq("order_id", order.id)
        .order("created_at", { ascending: true }),
      kind === "receipt"
        ? supabase
            .from("dg_order_payments" as never)
            .select("amount,transaction_id,paid_at,account_id")
            .eq("order_id", order.id)
            .order("paid_at", { ascending: false })
            .limit(1)
        : Promise.resolve({ data: [] }),
      supabase
        .from("dg_orders" as never)
        .select("county,town,address")
        .eq("id", order.id)
        .maybeSingle(),
    ]);
    const customer = customerData as unknown as CustomerRecord | null;
    const items = (itemData ?? []) as unknown as ItemRecord[];
    const payment = ((paymentData ?? []) as unknown as PaymentRecord[])[0] ?? null;
    const details = detailData as unknown as OrderDetails | null;
    let account: AccountRecord | null = null;
    if (payment?.account_id) {
      const { data } = await supabase
        .from("accounts")
        .select("name")
        .eq("id", payment.account_id)
        .maybeSingle();
      account = data as AccountRecord | null;
    }
    downloadPdf(order, kind, customer, items, payment, account, details);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Unable to generate the document.");
  }
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
        <FileText className="mr-1 h-3 w-3" /> Invoice PDF
      </Button>
      {order.payment_status === "paid" && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={() => void openDocument(order, "receipt")}
        >
          <ReceiptText className="mr-1 h-3 w-3" /> Receipt PDF
        </Button>
      )}
    </div>
  );
}
