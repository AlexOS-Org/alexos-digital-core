import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/lib/storefront/cart";
import { formatMoney, useStorefront } from "@/lib/storefront/api";
import { placeGuestOrder } from "@/lib/storefront/checkout.functions";

export const Route = createFileRoute("/shop/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | DailyGear" },
      { name: "description", content: "Securely complete your DailyGear order." },
      { property: "og:title", content: "Checkout | DailyGear" },
      { property: "og:description", content: "Securely complete your DailyGear order." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const { data: store } = useStorefront();
  const submit = useServerFn(placeGuestOrder);
  const currency = store?.currency ?? "KES";
  const threshold = Number(store?.free_shipping_threshold ?? 0);
  const shipping =
    threshold > 0 && cart.subtotal >= threshold ? 0 : Number(store?.flat_shipping_fee ?? 0);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    notes: "",
    paymentMethod: "cod",
  });

  const mutation = useMutation({
    mutationFn: async () =>
      submit({
        data: {
          storeSlug: store?.slug ?? "",
          ...form,
          items: cart.items.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            quantity: l.quantity,
          })),
        },
      }),
    onSuccess: (result) => {
      cart.clear();
      navigate({ to: "/shop/thank-you", search: { order: result.orderNumber } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-black">Nothing to check out</h1>
        <Button asChild className="mt-6 rounded-xl">
          <Link to="/shop/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-black tracking-tight">Checkout</h1>

      <form
        className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="space-y-6">
          <section className="space-y-4 rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Contact & delivery</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address">Delivery address</Label>
                <Input
                  id="address"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">City / town</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="notes">Order notes</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Payment method</h2>
            <RadioGroup
              value={form.paymentMethod}
              onValueChange={(v) => setForm({ ...form, paymentMethod: v })}
              className="grid gap-3"
            >
              {[
                { value: "cod", label: "Pay on delivery" },
                { value: "mpesa", label: "M-Pesa (instructions sent after ordering)" },
                { value: "bank_transfer", label: "Bank transfer" },
              ].map((o) => (
                <Label
                  key={o.value}
                  className="flex items-center gap-3 rounded-xl border p-3 text-sm"
                >
                  <RadioGroupItem value={o.value} /> {o.label}
                </Label>
              ))}
            </RadioGroup>
          </section>
        </div>

        <aside className="h-fit space-y-3 rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold">Order summary</h2>
          {cart.items.map((l) => (
            <div
              key={`${l.productId}-${l.variantId ?? ""}`}
              className="flex justify-between gap-3 text-sm"
            >
              <span className="min-w-0 truncate text-muted-foreground">
                {l.quantity} × {l.name}
              </span>
              <span className="shrink-0">{formatMoney(l.price * l.quantity, currency)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-3 text-sm">
            <span className="text-muted-foreground">Delivery</span>
            <span>{shipping === 0 ? "Free" : formatMoney(shipping, currency)}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatMoney(cart.subtotal + shipping, currency)}</span>
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full rounded-xl"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Placing order…" : "Place order"}
          </Button>
        </aside>
      </form>
    </div>
  );
}
