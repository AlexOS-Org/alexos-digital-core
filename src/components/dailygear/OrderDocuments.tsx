import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Order } from "@/lib/dailygear/types";
import { useAdminStorefront, type Storefront } from "@/lib/storefront/api";
import dailyGearLogo from "@/assets/branding/dailygear-logo.jpg";
import { FileText, ReceiptText } from "lucide-react";

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
type OrderDetails = {
  shipping_county: string | null;
  shipping_town: string | null;
  shipping_address: string | null;
  shipping_address_details: string | null;
  shipping_method: string | null;
  shipping_zone: string | null;
  shipping_fee: number;
};

type DocumentData = {
  store: Storefront | null;
  order: Order;
  kind: "invoice" | "receipt";
  customer: CustomerRecord | null;
  items: ItemRecord[];
  payment: PaymentRecord | null;
  account: AccountRecord | null;
  details: OrderDetails | null;
};

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const NAVY = rgb(0.04, 0.08, 0.18);
const TEAL = rgb(0.02, 0.55, 0.52);
const INK = rgb(0.11, 0.14, 0.19);
const MUTED = rgb(0.38, 0.42, 0.48);
const LINE = rgb(0.87, 0.89, 0.92);
const PALE = rgb(0.96, 0.98, 0.98);

function money(value: number) {
  return `KES ${Number(value || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function wrapText(text: string, maxChars: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else current = next;
  }
  if (current) lines.push(current);
  return lines;
}

async function fetchLogoBytes() {
  try {
    const response = await fetch(dailyGearLogo);
    if (!response.ok) return null;
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return null;
  }
}

function drawLabel(
  page: ReturnType<PDFDocument["addPage"]>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  label: string,
  value: string,
  x: number,
  y: number,
) {
  page.drawText(label.toUpperCase(), { x, y, size: 7, font, color: MUTED });
  page.drawText(value || "—", { x, y: y - 13, size: 10, font, color: INK });
}

async function createBrandedPdf(data: DocumentData) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logoBytes = await fetchLogoBytes();
  let cursor = PAGE_HEIGHT - 34;

  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 116, width: PAGE_WIDTH, height: 116, color: NAVY });
  if (logoBytes) {
    try {
      const logo = await pdf.embedJpg(logoBytes);
      const ratio = logo.height / logo.width;
      page.drawImage(logo, { x: 42, y: PAGE_HEIGHT - 74, width: 92, height: 92 * ratio });
    } catch {
      page.drawText("DAILYGEAR", {
        x: 42,
        y: PAGE_HEIGHT - 60,
        size: 20,
        font: bold,
        color: rgb(1, 1, 1),
      });
    }
  } else {
    page.drawText("DAILYGEAR", {
      x: 42,
      y: PAGE_HEIGHT - 60,
      size: 20,
      font: bold,
      color: rgb(1, 1, 1),
    });
  }
  page.drawText(data.store?.tagline ?? "Everyday essentials, delivered", {
    x: 42,
    y: PAGE_HEIGHT - 90,
    size: 8,
    font: regular,
    color: rgb(0.82, 0.9, 0.92),
  });
  page.drawText(data.kind === "invoice" ? "INVOICE" : "PAYMENT RECEIPT", {
    x: 395,
    y: PAGE_HEIGHT - 58,
    size: 18,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(data.order.order_number, {
    x: 395,
    y: PAGE_HEIGHT - 80,
    size: 9,
    font: regular,
    color: rgb(0.82, 0.9, 0.92),
  });
  cursor = PAGE_HEIGHT - 150;

  page.drawText(data.store?.name ?? "DailyGear", {
    x: 42,
    y: cursor,
    size: 11,
    font: bold,
    color: INK,
  });
  const contact = [data.store?.support_email, data.store?.support_phone, data.store?.whatsapp]
    .filter(Boolean)
    .join("  ·  ");
  page.drawText(contact || "Kenya", {
    x: 42,
    y: cursor - 14,
    size: 8.5,
    font: regular,
    color: MUTED,
  });
  page.drawText(`Issued ${new Date(data.order.placed_at).toLocaleDateString("en-KE")}`, {
    x: 395,
    y: cursor,
    size: 9,
    font: regular,
    color: MUTED,
  });
  page.drawText(data.kind === "receipt" ? "Payment confirmed" : "Please retain for your records", {
    x: 395,
    y: cursor - 14,
    size: 8.5,
    font: bold,
    color: data.kind === "receipt" ? TEAL : MUTED,
  });
  cursor -= 54;

  page.drawLine({
    start: { x: 42, y: cursor },
    end: { x: 553, y: cursor },
    thickness: 1,
    color: LINE,
  });
  cursor -= 25;
  drawLabel(
    page,
    regular,
    "Bill to",
    [data.customer?.first_name, data.customer?.last_name].filter(Boolean).join(" ") ||
      "Walk-in customer",
    42,
    cursor,
  );
  drawLabel(page, regular, "Email", data.customer?.email || "—", 225, cursor);
  drawLabel(page, regular, "Phone", data.customer?.phone || "—", 395, cursor);
  cursor -= 52;
  const delivery = data.details;
  drawLabel(
    page,
    regular,
    "Delivery location",
    [delivery?.shipping_town, delivery?.shipping_county].filter(Boolean).join(", ") || "—",
    42,
    cursor,
  );
  drawLabel(
    page,
    regular,
    "Address",
    [delivery?.shipping_address, delivery?.shipping_address_details].filter(Boolean).join(" · ") ||
      "—",
    225,
    cursor,
  );
  drawLabel(
    page,
    regular,
    "Delivery method",
    delivery?.shipping_method || delivery?.shipping_zone || "—",
    395,
    cursor,
  );
  cursor -= 58;

  page.drawRectangle({ x: 42, y: cursor - 22, width: 511, height: 28, color: PALE });
  page.drawText("ITEM", { x: 52, y: cursor - 12, size: 8, font: bold, color: MUTED });
  page.drawText("SKU", { x: 332, y: cursor - 12, size: 8, font: bold, color: MUTED });
  page.drawText("QTY", { x: 420, y: cursor - 12, size: 8, font: bold, color: MUTED });
  page.drawText("AMOUNT", { x: 475, y: cursor - 12, size: 8, font: bold, color: MUTED });
  cursor -= 48;
  for (const item of data.items) {
    const itemLines = wrapText(item.name, 42);
    page.drawText(itemLines[0] ?? "Item", { x: 52, y: cursor, size: 9, font: regular, color: INK });
    if (itemLines.length > 1)
      page.drawText(itemLines.slice(1).join(" "), {
        x: 52,
        y: cursor - 11,
        size: 8,
        font: regular,
        color: MUTED,
      });
    page.drawText(item.sku || "—", {
      x: 332,
      y: cursor,
      size: 8,
      font: regular,
      color: MUTED,
      maxWidth: 78,
    });
    page.drawText(String(item.quantity), { x: 425, y: cursor, size: 9, font: regular, color: INK });
    page.drawText(money(Number(item.total)), {
      x: 475,
      y: cursor,
      size: 9,
      font: regular,
      color: INK,
    });
    cursor -= itemLines.length > 1 ? 30 : 22;
  }
  page.drawLine({
    start: { x: 42, y: cursor + 7 },
    end: { x: 553, y: cursor + 7 },
    thickness: 1,
    color: LINE,
  });
  cursor -= 14;
  const subtotal = Number(
    data.order.subtotal ?? data.items.reduce((sum, item) => sum + Number(item.total || 0), 0),
  );
  const deliveryFee = Math.max(0, Number(delivery?.shipping_fee ?? data.order.shipping_fee ?? 0));
  const total = Number(data.order.total ?? subtotal + deliveryFee);
  const totals = [
    ["Subtotal", subtotal],
    [deliveryFee > 0 ? "Delivery" : "Delivery (free)", deliveryFee],
    ["Total", total],
  ] as const;
  for (const [label, value] of totals) {
    const isTotal = label === "Total";
    page.drawText(label, {
      x: 385,
      y: cursor,
      size: isTotal ? 11 : 9,
      font: isTotal ? bold : regular,
      color: isTotal ? INK : MUTED,
    });
    page.drawText(money(value), {
      x: 475,
      y: cursor,
      size: isTotal ? 11 : 9,
      font: isTotal ? bold : regular,
      color: isTotal ? TEAL : INK,
    });
    cursor -= isTotal ? 27 : 19;
  }

  page.drawRectangle({
    x: 42,
    y: cursor - 86,
    width: 511,
    height: 76,
    color: PALE,
    borderColor: LINE,
    borderWidth: 1,
  });
  page.drawText("PAYMENT INSTRUCTIONS", { x: 56, y: cursor - 28, size: 9, font: bold, color: INK });
  page.drawText("M-Pesa Paybill", { x: 56, y: cursor - 47, size: 8, font: regular, color: MUTED });
  page.drawText("542542", { x: 145, y: cursor - 47, size: 10, font: bold, color: TEAL });
  page.drawText("Account", { x: 230, y: cursor - 47, size: 8, font: regular, color: MUTED });
  page.drawText("184545", { x: 280, y: cursor - 47, size: 10, font: bold, color: TEAL });
  page.drawText(`Amount due: ${money(Math.max(0, total - Number(data.payment?.amount ?? 0)))}`, {
    x: 375,
    y: cursor - 47,
    size: 8.5,
    font: bold,
    color: INK,
  });
  page.drawText(
    data.kind === "receipt"
      ? `Received ${money(Number(data.payment?.amount ?? 0))} into ${data.account?.name ?? "the selected account"}. Reference: ${data.payment?.transaction_id ?? "—"}.`
      : "Use the order number as your reference where supported. Send the confirmation code to DailyGear for verification.",
    { x: 56, y: cursor - 65, size: 8, font: regular, color: MUTED, maxWidth: 475 },
  );
  cursor -= 116;

  page.drawText(
    data.kind === "receipt"
      ? "Payment recorded by DailyGear. Keep this receipt for your records."
      : "This invoice confirms the order details and is not proof of payment.",
    { x: 42, y: cursor, size: 8.5, font: bold, color: data.kind === "receipt" ? TEAL : MUTED },
  );
  page.drawText("Thank you for choosing DailyGear.", {
    x: 42,
    y: cursor - 18,
    size: 8,
    font: regular,
    color: MUTED,
  });
  page.drawText(
    `${data.store?.support_email ?? "dailygear.co.ke@gmail.com"}  ·  ${data.store?.support_phone ?? "0722658824"}`,
    { x: 42, y: 32, size: 8, font: regular, color: MUTED },
  );

  return pdf.save();
}

async function openDocument(order: Order, kind: "invoice" | "receipt", store: Storefront | null) {
  try {
    const [customerResult, itemResult, paymentResult, detailResult] = await Promise.all([
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
        .select(
          "shipping_county,shipping_town,shipping_address,shipping_address_details,shipping_method,shipping_zone,shipping_fee",
        )
        .eq("id", order.id)
        .maybeSingle(),
    ]);
    const customer = customerResult.data as unknown as CustomerRecord | null;
    const items = (itemResult.data ?? []) as unknown as ItemRecord[];
    const payment = ((paymentResult.data ?? []) as unknown as PaymentRecord[])[0] ?? null;
    const details = detailResult.data as unknown as OrderDetails | null;
    let account: AccountRecord | null = null;
    if (payment?.account_id) {
      const { data } = await supabase
        .from("accounts")
        .select("name")
        .eq("id", payment.account_id)
        .maybeSingle();
      account = data as AccountRecord | null;
    }
    const bytes = await createBrandedPdf({
      store,
      order,
      kind,
      customer,
      items,
      payment,
      account,
      details,
    });
    const pdfBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    const url = URL.createObjectURL(new Blob([pdfBuffer], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${kind}-${order.order_number}.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Unable to generate the document.");
  }
}

export function OrderDocuments({ order }: Props) {
  const { data: store } = useAdminStorefront();
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        size="sm"
        variant="ghost"
        className="h-8 px-2 text-xs"
        onClick={() => void openDocument(order, "invoice", store ?? null)}
      >
        <FileText className="mr-1 h-3 w-3" /> Invoice PDF
      </Button>
      {order.payment_status === "paid" ? (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={() => void openDocument(order, "receipt", store ?? null)}
        >
          <ReceiptText className="mr-1 h-3 w-3" /> Receipt PDF
        </Button>
      ) : null}
    </div>
  );
}

export default OrderDocuments;
