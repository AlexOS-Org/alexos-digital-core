import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cartStore, useCart } from "@/lib/storefront/cart";
import { formatMoney, useStorefront } from "@/lib/storefront/api";
import { loadCartSession } from "@/lib/storefront/cart-session.functions";
import { readCheckoutProfile, saveCheckoutProfile } from "@/lib/storefront/checkout-profile";
import { placeGuestOrder } from "@/lib/storefront/checkout.functions";
import { loadPublicFunnel } from "@/lib/storefront/funnel.functions";
import type { PublicFunnel } from "@/lib/storefront/funnel.server";
import { readFunnelAttribution } from "@/lib/storefront/funnel-session";
import { trackMetaPixel } from "@/lib/storefront/meta-pixel";
import { KENYA_COUNTIES, townsForCounty } from "@/lib/storefront/kenya-locations";

interface CheckoutSearch {
  recovery?: string;
  funnel?: string;
}

function SearchableLocationSelect({
  id,
  value,
  options,
  placeholder,
  searchPlaceholder,
  disabled,
  onChange,
}: {
  id: string;
  value: string;
  options: readonly string[];
  placeholder: string;
  searchPlaceholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-10 w-full justify-between rounded-xl font-normal"
        >
          <span className={value ? "truncate text-foreground" : "truncate text-muted-foreground"}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>No matching location.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${value === option ? "opacity-100" : "opacity-0"}`}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export const Route = createFileRoute("/shop/checkout")({
  validateSearch: (search: Record<string, unknown>): CheckoutSearch => ({
    recovery: typeof search["recovery"] === "string" ? search["recovery"] : undefined,
    funnel: typeof search["funnel"] === "string" ? search["funnel"] : undefined,
  }),
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
  const search = Route.useSearch();
  const { data: store } = useStorefront();
  const submit = useServerFn(placeGuestOrder);
  const loadRecovery = useServerFn(loadCartSession);
  const loadFunnel = useServerFn(loadPublicFunnel);
  const currency = store?.currency ?? "KES";
  const threshold = Number(store?.free_shipping_threshold ?? 0);
  const shipping =
    threshold > 0 && cart.subtotal >= threshold ? 0 : Number(store?.flat_shipping_fee ?? 0);
  useEffect(() => {
    if (cart.items.length === 0) return;
    trackMetaPixel("InitiateCheckout", {
      content_ids: cart.items.map((line) => line.sku ?? line.productId),
      content_type: "product",
      contents: cart.items.map((line) => ({
        id: line.sku ?? line.productId,
        quantity: line.quantity,
      })),
      currency,
      num_items: cart.items.reduce((sum, line) => sum + line.quantity, 0),
      value: cart.subtotal + shipping,
    });
  }, [cart.items, cart.subtotal, currency, shipping]);

  const [recoveryToken, setRecoveryToken] = useState<string | null>(search.recovery ?? null);
  const [funnelContext, setFunnelContext] = useState<PublicFunnel | null>(null);
  const [orderBumpAccepted, setOrderBumpAccepted] = useState(false);
  const [recoveryState, setRecoveryState] = useState<"idle" | "loading" | "loaded" | "unavailable">(
    search.recovery ? "loading" : "idle",
  );
  const rememberDetails = true;
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [townInputMode, setTownInputMode] = useState<"list" | "manual">("list");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    country: "Kenya",
    county: "",
    town: "",
    deliveryDetails: "",
    city: "",
    notes: "",
    paymentMethod: "cod",
  });
  const selectedCounty = KENYA_COUNTIES.find((county) => county.name === form.county);
  const availableTowns = townsForCounty(selectedCounty?.slug);
  const isNearbyDeliveryArea = new Set(["nairobi", "kiambu", "kajiado"]).has(
    form.county.trim().toLowerCase(),
  );

  useEffect(() => {
    if (search.recovery) return;
    const profile = readCheckoutProfile();
    if (!profile) return;
    setForm((previous) => ({
      ...previous,
      firstName: profile.firstName || previous.firstName,
      lastName: profile.lastName || previous.lastName,
      email: profile.email || previous.email,
      phone: profile.phone || previous.phone,
      address: profile.address || previous.address,
      county: profile.county || previous.county,
      town: profile.town || previous.town,
      city: profile.town || previous.city,
      deliveryDetails: profile.deliveryDetails || previous.deliveryDetails,
    }));
    setProfileLoaded(true);
  }, [search.recovery]);

  useEffect(() => {
    const funnelSlug = search.funnel;
    if (!funnelSlug) {
      setFunnelContext(null);
      return;
    }
    let cancelled = false;
    void loadFunnel({ data: { slug: funnelSlug } })
      .then((funnel) => {
        if (!cancelled) setFunnelContext(funnel);
      })
      .catch(() => {
        if (!cancelled) toast.error("This campaign context is no longer available.");
      });
    return () => {
      cancelled = true;
    };
  }, [loadFunnel, search.funnel]);

  useEffect(() => {
    const token = search.recovery;
    if (!token) return;
    let cancelled = false;
    setRecoveryState("loading");
    void loadRecovery({ data: { sessionToken: token } })
      .then((recovery) => {
        if (cancelled) return;
        if (!recovery) {
          setRecoveryState("unavailable");
          return;
        }
        cartStore.replace(recovery.items);
        setForm((previous) => ({
          ...previous,
          firstName: recovery.firstName ?? previous.firstName,
          email: recovery.email,
          phone: recovery.phone ?? previous.phone,
        }));
        setRecoveryToken(recovery.sessionToken);
        setRecoveryState("loaded");
      })
      .catch(() => {
        if (!cancelled) setRecoveryState("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, [loadRecovery, search.recovery]);

  const orderBump = funnelContext?.steps.find(
    (step) => step.stepType === "order_bump" && step.productId,
  );
  const orderBumpProduct = orderBump
    ? (funnelContext?.offerProducts.find((product) => product.id === orderBump.productId) ?? null)
    : null;
  const orderBumpPrice = orderBumpProduct
    ? orderBumpProduct.salePrice != null &&
      orderBumpProduct.salePrice > 0 &&
      orderBumpProduct.salePrice < orderBumpProduct.price
      ? orderBumpProduct.salePrice
      : orderBumpProduct.price
    : 0;

  useEffect(() => {
    setOrderBumpAccepted(
      Boolean(
        orderBump &&
        cart.items.some(
          (item) => item.offerRole === "order_bump" && item.productId === orderBump.productId,
        ),
      ),
    );
  }, [cart.items, orderBump]);

  function updateCounty(county: string) {
    setTownInputMode("list");
    setForm((previous) => ({ ...previous, county, town: "", city: "" }));
  }

  function updateTown(town: string) {
    setForm((previous) => ({ ...previous, town, city: town }));
  }

  function toggleOrderBump(checked: boolean) {
    if (!orderBump || !orderBumpProduct) return;
    if (checked) {
      cartStore.add(
        {
          productId: orderBumpProduct.id,
          variantId: null,
          name: orderBumpProduct.name,
          sku: orderBumpProduct.sku,
          price: orderBumpPrice,
          image: orderBumpProduct.images[0] ?? null,
          maxQuantity: Number.MAX_SAFE_INTEGER,
          offerRole: "order_bump",
          funnelStepId: orderBump.id,
          funnelSlug: funnelContext?.slug ?? null,
        },
        1,
      );
    } else {
      cartStore.remove(
        orderBumpProduct.id,
        null,
        "order_bump",
        orderBump.id,
        funnelContext?.slug ?? null,
      );
    }
    setOrderBumpAccepted(checked);
  }

  const mutation = useMutation({
    mutationFn: async (submittedRecoveryToken?: string | null) =>
      submit({
        data: {
          storeSlug: store?.slug ?? "",
          ...form,
          items: cart.items.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            quantity: l.quantity,
            offerRole: l.offerRole,
            funnelStepId: l.funnelStepId,
          })),
          recoveryToken: submittedRecoveryToken ?? recoveryToken,
          funnelId: funnelContext?.id ?? null,
          attribution: funnelContext ? readFunnelAttribution() : null,
        },
      }),
    onSuccess: (result) => {
      const contentIds = cart.items
        .map((line) => line.sku ?? line.productId)
        .filter(Boolean)
        .join(",");
      if (rememberDetails) {
        saveCheckoutProfile({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          address: form.address,
          county: form.county,
          town: form.town,
          deliveryDetails: form.deliveryDetails,
        });
      }
      if (typeof window !== "undefined" && result.confirmation) {
        window.sessionStorage.setItem(
          "dailygear:last-confirmation",
          JSON.stringify({
            order: result.orderNumber,
            confirmation: result.confirmation,
            expiresAt: Date.now() + 30 * 60_000,
          }),
        );
      }
      cart.clear();
      navigate({
        to: "/shop/thank-you",
        search: {
          order: result.orderNumber,
          funnel: funnelContext?.slug,
          value: result.total,
          currency: result.currency,
          contentIds,
        },
      });
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
      <div className="mt-3 rounded-2xl border bg-muted/40 p-4">
        <p className="text-sm font-semibold">Review before placing your order</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          DailyGear rechecks the current product or variant price and availability when you place
          the order. Payment instructions or status depend on the method you choose and are not
          treated as settled until confirmed.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-primary">
          <Link to="/shop/policies/$slug" params={{ slug: "shipping" }} className="hover:underline">
            Shipping
          </Link>
          <Link to="/shop/policies/$slug" params={{ slug: "returns" }} className="hover:underline">
            Returns & refunds
          </Link>
          <Link to="/shop/policies/$slug" params={{ slug: "privacy" }} className="hover:underline">
            Privacy
          </Link>
          <Link to="/shop/policies/$slug" params={{ slug: "terms" }} className="hover:underline">
            Terms
          </Link>
        </div>
      </div>

      <form
        className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!form.county || !form.town.trim()) {
            toast.error("Select or type a delivery town or area.");
            return;
          }
          mutation.mutate(recoveryToken);
        }}
      >
        <div className="space-y-6">
          <section className="space-y-4 rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Contact & delivery</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">
                  First name <span className="text-destructive">*</span>
                </Label>

                <Input
                  id="firstName"
                  required
                  autoComplete="given-name"
                  value={form.firstName}

                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name (optional)</Label>

                <Input
                  id="lastName"
                  autoComplete="family-name"
                  value={form.lastName}

                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone (required for delivery)</Label>

                <Input
                  id="phone"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.phone}

                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}

                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              {profileLoaded ? (
                <p className="text-xs text-primary sm:col-span-2">
                  Saved delivery details were filled from this device. Review them before ordering.
                </p>
              ) : null}
              {recoveryState === "loaded" ? (
                <p className="text-xs text-emerald-700 sm:col-span-2">
                  Your saved DailyGear bag has been restored.
                </p>
              ) : recoveryState === "unavailable" ? (
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  This saved bag is no longer available. You can continue with the items currently
                  in your bag.
                </p>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="country">Country</Label>
                <select
                  id="country"
                  value={form.country}
                  disabled
                  className="h-10 w-full rounded-xl border bg-muted px-3 text-sm outline-none"
                >
                  <option value="Kenya">Kenya</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  DailyGear currently delivers within Kenya.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="county">
                  County <span className="text-destructive">*</span>
                </Label>
                <SearchableLocationSelect
                  id="county"
                  value={form.county}
                  options={KENYA_COUNTIES.map((county) => county.name)}
                  placeholder="Select county"
                  searchPlaceholder="Search counties"
                  onChange={updateCounty}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="town">
                    Town or area <span className="text-destructive">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-lg px-2 text-xs"
                    disabled={!form.county}
                    onClick={() => {
                      setTownInputMode((mode) => (mode === "list" ? "manual" : "list"));
                      if (townInputMode === "list") updateTown("");
                    }}
                  >
                    {townInputMode === "list" ? "Type a town or area" : "Choose from list"}
                  </Button>
                </div>
                {townInputMode === "manual" ? (
                  <Input
                    id="town"
                    required
                    disabled={!form.county}
                    value={form.town}
                    onChange={(event) => updateTown(event.target.value)}
                    placeholder="Type town, estate or area"
                    autoComplete="address-level2"
                  />
                ) : (
                  <SearchableLocationSelect
                    id="town"
                    value={form.town}
                    options={availableTowns}
                    placeholder={form.county ? "Select town or area" : "Select a county first"}
                    searchPlaceholder="Search towns and areas"
                    disabled={!form.county}
                    onChange={updateTown}
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  {form.town && !availableTowns.includes(form.town)
                    ? "Manual location entered; add an estate, landmark or delivery instruction below."
                    : "Choose a major town or area, or type one if it is not listed."}
                </p>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address">
                  Street, building, house or shop number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  required
                  autoComplete="street-address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="delivery-details">
                  Estate, landmark or delivery instructions (optional)
                </Label>
                <Textarea
                  id="delivery-details"
                  value={form.deliveryDetails}
                  onChange={(e) => setForm({ ...form, deliveryDetails: e.target.value })}
                  placeholder="For example: estate name, nearest landmark or delivery instructions"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="notes">Order notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
          </section>

          {orderBump && orderBumpProduct ? (
            <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="checkout-order-bump"
                  checked={orderBumpAccepted}
                  onCheckedChange={(checked) => toggleOrderBump(checked === true)}
                />
                <div className="min-w-0 flex-1">
                  <Label
                    htmlFor="checkout-order-bump"
                    className="cursor-pointer text-sm font-semibold"
                  >
                    Add {orderBumpProduct.name} to this order
                  </Label>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Optional add-on · {formatMoney(orderBumpPrice, currency)}. It will be reviewed
                    as part of this same order and can be declined.
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          <section className="space-y-4 rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Payment method</h2>
            <RadioGroup
              value={form.paymentMethod}
              onValueChange={(v) => {
                setForm({ ...form, paymentMethod: v });
                trackMetaPixel("AddPaymentInfo", {
                  content_ids: cart.items.map((line) => line.sku ?? line.productId),
                  content_type: "product",
                  contents: cart.items.map((line) => ({
                    id: line.sku ?? line.productId,
                    quantity: line.quantity,
                  })),
                  currency,
                  value: cart.subtotal + shipping,
                  payment_method: v,
                });
              }}
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
            {form.paymentMethod === "mpesa" ? (
              <div className="rounded-xl border border-primary/20 bg-primary/[0.05] p-4 text-xs leading-relaxed">
                <p className="font-semibold text-foreground">Complete payment securely by M-Pesa</p>
                <p className="mt-1 text-muted-foreground">
                  Paybill <strong className="text-foreground">542542</strong> · Account{" "}
                  <strong className="text-foreground">184545</strong> · Amount{" "}
                  <strong className="text-foreground">
                    {formatMoney(cart.subtotal + shipping, currency)}
                  </strong>
                </p>
                <p className="mt-2 text-muted-foreground">
                  {isNearbyDeliveryArea
                    ? "Your area is within our nearby delivery area. We will confirm the route and dispatch details after your order."
                    : "Your area is outside our nearby Nairobi-area route. Paying before dispatch helps us confirm the route; any delivery benefit or discount is offered only when it is explicitly approved and remains profit-safe."}
                </p>
                <p className="mt-2 text-muted-foreground">
                  After paying, keep the M-Pesa code and reply to the confirmation email or WhatsApp
                  message so we can match your receipt. You may choose pay on delivery instead if
                  that option is available for your route.
                </p>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="h-fit space-y-3 rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold">Order summary</h2>
          {cart.items.map((l) => (
            <div
              key={`${l.productId}-${l.variantId ?? ""}-${l.offerRole ?? "primary"}`}
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
          {mutation.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {(mutation.error as Error).message}
            </p>
          ) : null}
          <p className="text-xs leading-relaxed text-muted-foreground">
            By placing this order, you confirm your delivery details are correct and agree to the
            DailyGear terms and policies.
          </p>
          <Button
            type="submit"
            size="lg"
            className="w-full rounded-xl"
            disabled={mutation.isPending}
            aria-busy={mutation.isPending}
          >
            {mutation.isPending ? "Placing order…" : "Place order"}
          </Button>
        </aside>
      </form>
    </div>
  );
}
