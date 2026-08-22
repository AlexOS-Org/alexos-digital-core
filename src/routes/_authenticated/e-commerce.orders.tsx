import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  Edit3,
  PackageCheck,
  ShoppingCart,
  Search,
  ReceiptText,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { KpiCard } from "@/components/dailygear/KpiCard";
import { StatusBadge } from "@/components/dailygear/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCommerceData } from "@/lib/dailygear/useCommerceData";
import { useUpdateOrderStatus } from "@/lib/dailygear/api";
import { OrderEditDialog } from "@/components/dailygear/OrderEditDialog";
import { OrderFulfilmentDialog } from "@/components/dailygear/OrderFulfilmentDialog";
import { OrderPaymentDialog } from "@/components/dailygear/OrderPaymentDialog";
import { OrderDocuments } from "@/components/dailygear/OrderDocuments";
import { OrderRefundDialog } from "@/components/dailygear/OrderRefundDialog";
import { useDeleteOrder } from "@/lib/dailygear/api";
import {
  DG_CURRENCY,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
} from "@/lib/dailygear/constants";
import type { Customer, Order } from "@/lib/dailygear/types";

export const Route = createFileRoute("/_authenticated/e-commerce/orders")({
  head: () => ({
    meta: [
      { title: "Orders | DailyGear" },
      { name: "description", content: "Fulfilment pipeline, payments, shipping and timelines." },
      { property: "og:title", content: "Orders | DailyGear" },
      {
        property: "og:description",
        content: "Fulfilment pipeline, payments, shipping and timelines.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrdersPage,
});

const money = (v: number) =>
  `${DG_CURRENCY} ${Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const COUNTS_AS_SALE: Order["status"][] = ["new", "processing", "packed", "shipped", "delivered"];

/** Returns the next status in the fulfilment flow, or null if already terminal. */
function nextStatus(current: Order["status"]): Order["status"] | null {
  const idx = ORDER_STATUS_FLOW.indexOf(current as (typeof ORDER_STATUS_FLOW)[number]);
  if (idx === -1 || idx === ORDER_STATUS_FLOW.length - 1) return null;
  return ORDER_STATUS_FLOW[idx + 1];
}

function resolveCustomerName(customerId: string | null, customers: Customer[]): string {
  if (!customerId) return "Walk-in";
  const c = customers.find((x) => x.id === customerId);
  if (!c) return "Unknown";
  return [c.first_name, c.last_name].filter(Boolean).join(" ");
}

function OrdersPage() {
  const { orders, customers, isLoading } = useCommerceData();
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Order["status"] | "all">("all");
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [fulfillingOrder, setFulfillingOrder] = useState<Order | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [paymentAfterStatus, setPaymentAfterStatus] = useState<Order["status"] | null>(null);
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);

  const summary = useMemo(() => {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 30 * 86_400_000);
    const recent = orders.filter(
      (o) => COUNTS_AS_SALE.includes(o.status) && new Date(o.placed_at) >= windowStart,
    );
    const pending = orders.filter((o) => ["new", "processing", "packed"].includes(o.status));
    const revenue = recent.reduce((s, o) => s + Number(o.total ?? 0), 0);
    const avg = recent.length > 0 ? revenue / recent.length : 0;
    return { total: orders.length, pending: pending.length, revenue, avg };
  }, [orders]);

  function advanceOrder(order: Order, next: Order["status"]) {
    if (
      next === "delivered" &&
      order.payment_status !== "paid" &&
      order.payment_status !== "refunded"
    ) {
      setPaymentOrder(order);
      setPaymentAfterStatus(next);
      return;
    }
    updateStatus.mutate({ order, status: next });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders
      .filter((o) => statusFilter === "all" || o.status === statusFilter)
      .filter((o) => {
        if (!q) return true;
        const name = resolveCustomerName(o.customer_id, customers).toLowerCase();
        return (
          name.includes(q) ||
          (o.order_number ?? "").toLowerCase().includes(q) ||
          (o.channel ?? "").toLowerCase().includes(q)
        );
      });
  }, [orders, customers, query, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Fulfilment pipeline, payments, shipping and timelines."
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total orders"
          value={summary.total}
          icon={ShoppingCart}
          loading={isLoading}
        />
        <KpiCard
          label="Pending fulfilment"
          value={summary.pending}
          icon={Clock}
          tone={summary.pending > 0 ? "warning" : "default"}
          hint={summary.pending > 0 ? "Awaiting processing or shipping" : "All orders fulfilled"}
          loading={isLoading}
        />
        <KpiCard
          label="Revenue (30d)"
          value={money(summary.revenue)}
          icon={DollarSign}
          loading={isLoading}
        />
        <KpiCard
          label="Avg order value"
          value={money(summary.avg)}
          icon={CheckCircle}
          tone="positive"
          loading={isLoading}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search customer, order #, channel…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as Order["status"] | "all")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(ORDER_STATUS_META) as Order["status"][]).map((key) => (
              <SelectItem key={key} value={key}>
                {ORDER_STATUS_META[key].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && <Skeleton className="h-72 w-full rounded-2xl" />}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <ShoppingCart className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {orders.length
                ? "No orders match your current filters."
                : "No orders yet. Orders placed via any channel will appear here."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!isLoading && filtered.length > 0 && (
        <Card className="rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Order #</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Advance</th>
                  <th className="px-4 py-3 font-medium">Manage</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const next = nextStatus(order.status);
                  return (
                    <tr key={order.id} className="border-t border-border/70 hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-muted-foreground">
                        {order.order_number ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {resolveCustomerName(order.customer_id, customers)}
                      </td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">
                        {(order.channel ?? "—").replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge meta={ORDER_STATUS_META[order.status]} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge meta={PAYMENT_STATUS_META[order.payment_status]} />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {money(Number(order.total ?? 0))}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(order.placed_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {next && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="whitespace-nowrap text-xs"
                              disabled={updateStatus.isPending}
                              onClick={() => advanceOrder(order, next)}
                            >
                              {next === "delivered" &&
                              order.payment_status !== "paid" &&
                              order.payment_status !== "refunded"
                                ? "Record payment & deliver"
                                : ORDER_STATUS_META[next].label}
                              <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                          )}
                          <OrderDocuments order={order} />
                          {order.payment_status !== "paid" &&
                            order.payment_status !== "refunded" && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="whitespace-nowrap text-xs"
                                onClick={() => setPaymentOrder(order)}
                              >
                                <ReceiptText className="mr-1 h-3 w-3" />
                                Confirm paid
                              </Button>
                            )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="whitespace-nowrap text-xs"
                            onClick={() => setEditingOrder(order)}
                          >
                            <Edit3 className="mr-1 h-3.5 w-3.5" />
                            Edit details
                          </Button>
                          {order.status === "new" || order.status === "processing" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="whitespace-nowrap text-xs"
                              onClick={() => setFulfillingOrder(order)}
                            >
                              <PackageCheck className="mr-1 h-3.5 w-3.5" />
                              Record costs & fulfil
                            </Button>
                          ) : null}
                          {order.payment_status === "paid" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="whitespace-nowrap text-xs text-destructive hover:text-destructive"
                              onClick={() => setRefundOrder(order)}
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" /> Void / refund
                            </Button>
                          ) : null}
                          {order.payment_status === "unpaid" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="whitespace-nowrap text-xs text-destructive hover:text-destructive"
                              disabled={deleteOrder.isPending}
                              onClick={() => {
                                if (
                                  typeof window !== "undefined" &&
                                  !window.confirm(
                                    `Remove unpaid test order ${order.order_number ?? ""}? This is a soft delete and cannot remove any payment transaction.`,
                                  )
                                )
                                  return;
                                deleteOrder.mutate(order.id);
                              }}
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove test order
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <OrderFulfilmentDialog
        open={Boolean(fulfillingOrder)}
        onOpenChange={(open) => {
          if (!open) setFulfillingOrder(null);
        }}
        order={fulfillingOrder}
      />

      <OrderEditDialog
        open={Boolean(editingOrder)}
        onOpenChange={(open) => {
          if (!open) setEditingOrder(null);
        }}
        order={editingOrder}
        customer={
          editingOrder?.customer_id
            ? (customers.find((customer) => customer.id === editingOrder.customer_id) ?? null)
            : null
        }
      />

      <OrderRefundDialog
        open={Boolean(refundOrder)}
        onOpenChange={(open) => {
          if (!open) setRefundOrder(null);
        }}
        order={refundOrder}
      />

      <OrderPaymentDialog
        open={Boolean(paymentOrder)}
        onOpenChange={(open) => {
          if (!open) {
            setPaymentOrder(null);
            setPaymentAfterStatus(null);
          }
        }}
        order={paymentOrder}
        onConfirmed={(result) => {
          if (paymentAfterStatus && paymentOrder && result.payment_status === "paid") {
            updateStatus.mutate({ order: paymentOrder, status: paymentAfterStatus });
          }
          setPaymentAfterStatus(null);
        }}
      />
    </div>
  );
}
