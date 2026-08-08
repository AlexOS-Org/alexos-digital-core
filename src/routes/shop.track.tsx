import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trackOrder } from "@/lib/storefront/checkout.functions";

export const Route = createFileRoute("/shop/track")({
  head: () => ({
    meta: [
      { title: "Track your order | DailyGear" },
      { name: "description", content: "Look up the status of a DailyGear order." },
      { property: "og:title", content: "Track your order | DailyGear" },
      { property: "og:description", content: "Look up the status of a DailyGear order." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const lookup = useServerFn(trackOrder);
  const [orderNumber, setOrderNumber] = useState("");
  const [contact, setContact] = useState("");

  const mutation = useMutation({
    mutationFn: async () => lookup({ data: { orderNumber, contact } }),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-black tracking-tight">Track your order</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your order number and the phone or email used at checkout.
      </p>

      <form
        className="mt-6 space-y-4 rounded-2xl border bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="order">Order number</Label>
          <Input
            id="order"
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="DG-20260101-1234"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact">Phone or email</Label>
          <Input
            id="contact"
            required
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full rounded-xl" disabled={mutation.isPending}>
          {mutation.isPending ? "Looking up…" : "Track order"}
        </Button>
      </form>

      {mutation.isError ? (
        <p className="mt-4 text-sm text-destructive">{(mutation.error as Error).message}</p>
      ) : null}

      {mutation.data ? (
        <div className="mt-6 space-y-4 rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold">{mutation.data.orderNumber}</span>
            <Badge className="rounded-full capitalize">{mutation.data.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Payment: <span className="capitalize">{mutation.data.paymentStatus}</span> · Total:{" "}
            {mutation.data.currency} {mutation.data.total.toLocaleString()}
          </p>
          <ol className="space-y-2 border-l pl-4 text-sm">
            {mutation.data.events.map((ev) => (
              <li key={ev.id}>
                <p className="font-medium">{ev.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(ev.occurred_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
