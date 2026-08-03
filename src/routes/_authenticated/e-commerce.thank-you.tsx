import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCommerceData } from "@/lib/dailygear/useCommerceData";
import { DG_CURRENCY } from "@/lib/dailygear/constants";

export const Route = createFileRoute("/_authenticated/e-commerce/thank-you")({
  head: () => ({
    meta: [
      { title: "Thank you | DailyGear" },
      {
        name: "description",
        content: "Order confirmation and next steps for your DailyGear checkout.",
      },
      { property: "og:title", content: "Thank you | DailyGear" },
      {
        property: "og:description",
        content: "The order was received and is ready for fulfilment.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ThankYouPage,
});

function formatMoney(value: number) {
  return `${DG_CURRENCY} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function ThankYouPage() {
  const navigate = useNavigate();
  const search = useRouterState({ select: (r) => r.location.search });
  const { orders, customers, isLoading } = useCommerceData();
  const params = new URLSearchParams(search ?? "");
  const orderId = params.get("orderId");
  const orderNumber = params.get("orderNumber");

  const order = orders.find((o) => o.id === orderId) ?? null;
  const customer = order?.customer_id ? customers.find((c) => c.id === order.customer_id) : null;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-success/5 p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-success text-success-foreground">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Thank you!</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your order has been created and is ready for fulfilment.
        </p>
        {orderNumber && (
          <p className="mt-2 text-sm">
            Order reference: <span className="font-medium">{orderNumber}</span>
          </p>
        )}
        {!orderNumber && order && (
          <p className="mt-2 text-sm">
            Order reference: <span className="font-medium">{order.order_number}</span>
          </p>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-3xl border-border">
          <CardContent className="space-y-3">
            <h2 className="text-lg font-semibold">Order details</h2>
            {order ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Order number:{" "}
                  <span className="text-foreground font-medium">{order.order_number}</span>
                </p>
                <p>
                  Status: <span className="font-medium">{order.status}</span>
                </p>
                <p>
                  Payment: <span className="font-medium">{order.payment_status}</span>
                </p>
                <p>
                  Channel: <span className="font-medium">{order.channel}</span>
                </p>
                <p>
                  Shipping address:{" "}
                  <span className="font-medium">{order.shipping_address ?? "Not provided"}</span>
                </p>
                <p>
                  Total:{" "}
                  <span className="font-medium">{formatMoney(Number(order.total ?? 0))}</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Order details will appear once the data is available.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border">
          <CardContent className="space-y-3">
            <h2 className="text-lg font-semibold">Customer</h2>
            {customer ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  {customer.first_name} {customer.last_name}
                </p>
                <p>{customer.email ?? "No email"}</p>
                <p>{customer.phone ?? "No phone"}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This order was created for a walk-in or guest customer.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => navigate({ to: "/e-commerce/orders" })}>
          View orders
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate({ to: "/e-commerce/store" })}
        >
          Back to store preview
        </Button>
      </div>
    </div>
  );
}
