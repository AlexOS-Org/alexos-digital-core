import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/shop/thank-you")({
  validateSearch: (search: Record<string, unknown>) => ({
    order: typeof search["order"] === "string" ? search["order"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Order confirmed | DailyGear" },
      { name: "description", content: "Your DailyGear order has been received." },
      { property: "og:title", content: "Order confirmed | DailyGear" },
      { property: "og:description", content: "Your DailyGear order has been received." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThankYou,
});

function ThankYou() {
  const { order } = Route.useSearch();
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
      <h1 className="mt-4 text-3xl font-black tracking-tight">Thank you for your order</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We have received your order and will be in touch shortly to confirm delivery.
      </p>
      {order ? (
        <p className="mt-6 rounded-2xl border bg-card p-4 text-sm">
          Your order number is <span className="font-bold">{order}</span>. Keep it safe — you can
          use it to track your delivery.
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild className="rounded-xl">
          <Link to="/shop/track">Track my order</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/shop/products">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}
