import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Plus, RefreshCcw, ShoppingCart, Truck, Wallet } from "lucide-react";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCommerceData } from "@/lib/dailygear/useCommerceData";
import { useOrderCart } from "@/lib/dailygear/useOrderCart";
import {
  useSaveOrderWithItems,
  type DraftOrder,
  type DraftOrderItem,
  useVariants,
  useCustomers,
} from "@/lib/dailygear/api";
import {
  DG_CURRENCY,
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  SALES_CHANNELS,
} from "@/lib/dailygear/constants";
import type { Order, PaymentStatus } from "@/lib/dailygear/types";
import { KENYA_COUNTIES, townsForCounty } from "@/lib/storefront/kenya-locations";

const COUPONS: Record<string, number> = {
  SAVE5: 0.05,
  PAYNOW5: 0.05,
  WELCOME10: 0.1,
};

export const Route = createFileRoute("/_authenticated/e-commerce/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | DailyGear" },
      {
        name: "description",
        content: "Create an order with customer, delivery, payment and line item details.",
      },
      { property: "og:title", content: "Checkout | DailyGear" },
      {
        property: "og:description",
        content: "Build an order, reserve inventory and collect customer details for delivery.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: CheckoutPage,
});

function money(value: number) {
  return `${DG_CURRENCY} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function getStatusOptions(): Order["status"][] {
  return ["new", "processing", "packed", "shipped", "delivered"];
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { products, isLoading } = useCommerceData();
  const variants = useVariants();
  const { data: customers = [] } = useCustomers();
  const cart = useOrderCart();
  const saveOrder = useSaveOrderWithItems();

  const [customerId, setCustomerId] = useState<string | "walk-in">("walk-in");
  const [channel, setChannel] = useState<string>(SALES_CHANNELS[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash on delivery");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("unpaid");
  const [shippingMethod, setShippingMethod] = useState<string>("Delivery");
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingAddress, setShippingAddress] = useState("");
  const [county, setCounty] = useState("");
  const [town, setTown] = useState("");
  const [townInputMode, setTownInputMode] = useState<"list" | "manual">("list");
  const [shippingDetails, setShippingDetails] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState("");

  const productMap = useMemo(
    () => Object.fromEntries(products.map((product) => [product.id, product])),
    [products],
  );
  const variantsMap = useMemo(
    () => Object.fromEntries(variants.data?.map((variant) => [variant.id, variant]) ?? []),
    [variants.data],
  );
  const productVariants = useMemo(
    () => (productId: string | null) =>
      variants.data?.filter((variant) => variant.product_id === productId) ?? [],
    [variants.data],
  );

  const subtotal = useMemo(
    () => cart.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
    [cart.items],
  );
  const total = Math.max(0, subtotal + Number(shippingFee) + Number(tax) - Number(discount));

  const availableTowns = townsForCounty(KENYA_COUNTIES.find((item) => item.name === county)?.slug);
  const ready = cart.items.length > 0 && cart.items.some((item) => item.product_id);

  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponMessage("Enter a coupon code to apply savings.");
      setDiscount(0);
      return;
    }
    const percent = COUPONS[code];
    if (!percent) {
      setCouponMessage("This coupon code is not recognized.");
      setDiscount(0);
      return;
    }
    const amount = Math.round(subtotal * percent);
    setDiscount(amount);
    setCouponMessage(`Coupon ${code} applied — ${percent * 100}% off.`);
  };

  const handleProductChange = (itemId: string, productId: string) => {
    const product = productMap[productId];
    if (!product) return;
    const unitPrice = Number(product.sale_price ?? product.price);
    const unitCost = Number(product.cost_price ?? 0);
    cart.updateItem(itemId, {
      product_id: product.id,
      variant_id: null,
      name: product.name,
      sku: product.sku,
      quantity: 1,
      unit_price: unitPrice,
      unit_cost: unitCost,
    });
  };

  const handleVariantChange = (itemId: string, variantId: string) => {
    const item = cart.items.find((line) => line.id === itemId);
    if (!item) return;
    const variant = variantsMap[variantId];
    const product = item.product_id ? productMap[item.product_id] : null;
    if (!variant || !product) return;

    cart.updateItem(itemId, {
      variant_id: variant.id,
      name: `${product.name} – ${variant.name}`,
      sku: variant.sku ?? item.sku,
      unit_price: Number(variant.sale_price ?? variant.price ?? item.unit_price),
      unit_cost: Number(variant.cost_price ?? item.unit_cost),
    });
  };

  const handleSubmit = async () => {
    if (!ready) return;
    const shipping = [
      shippingDetails.trim(),
      shippingAddress.trim(),
      town.trim(),
      county.trim(),
      "Kenya",
    ]
      .filter(Boolean)
      .join(", ");
    const draft: DraftOrder = {
      customer_id: customerId === "walk-in" ? null : customerId,
      channel,
      status: "new",
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      shipping_method: shippingMethod,
      shipping_fee: shippingFee,
      discount,
      tax,
      shipping_address: shipping || null,
      shipping_country: "Kenya",
      shipping_county: county.trim() || null,
      shipping_town: town.trim() || null,
      shipping_address_details: shippingDetails.trim() || null,
      notes,
      items: cart.items.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        name: item.name || "Custom item",
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_cost: item.unit_cost,
      })),
    };

    try {
      const result = await saveOrder.mutateAsync(draft);
      cart.clear();
      navigate({
        to: "/e-commerce/thank-you",
        search: {
          orderId: result.orderId,
          orderNumber: result.orderNumber ?? "",
        },
      });
    } catch {
      // toast handled by hook
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Checkout"
        description="Create a complete order with delivery, payment and customer details."
        actions={
          <Button variant="outline" onClick={() => cart.addBlankItem()}>
            <Plus className="mr-2 h-4 w-4" /> Add line item
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.75fr]">
        <div className="space-y-4">
          <Card className="rounded-3xl border-border">
            <CardHeader>
              <CardTitle>Order details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground">Customer</label>
                  <Select
                    value={customerId}
                    onValueChange={(value) => setCustomerId(value as string | "walk-in")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Walk-in or select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walk-in">Walk-in customer</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.first_name} {customer.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Sales channel</label>
                  <Select value={channel} onValueChange={(value) => setChannel(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {SALES_CHANNELS.map((channelOption) => (
                        <SelectItem key={channelOption} value={channelOption}>
                          {channelOption.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground">Payment method</label>
                  <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash on delivery">Cash on delivery</SelectItem>
                      <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                      <SelectItem value="Bank transfer">Bank transfer</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Payment status</label>
                  <Select
                    value={paymentStatus}
                    onValueChange={(value) => setPaymentStatus(value as PaymentStatus)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(PAYMENT_STATUS_META).map((status) => (
                        <SelectItem key={status} value={status}>
                          {PAYMENT_STATUS_META[status as PaymentStatus].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground">Shipping method</label>
                  <Select
                    value={shippingMethod}
                    onValueChange={(value) => setShippingMethod(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Shipping method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Delivery">Delivery</SelectItem>
                      <SelectItem value="Pick up">Pick up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Order status</label>
                  <Select value="new" disabled>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="New order" />
                    </SelectTrigger>
                    <SelectContent>
                      {getStatusOptions().map((status) => (
                        <SelectItem key={status} value={status}>
                          {ORDER_STATUS_META[status].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  type="number"
                  min={0}
                  value={shippingFee}
                  onChange={(e) => setShippingFee(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="Shipping fee"
                />
                <div className="rounded-2xl border border-border p-3 bg-muted/50">
                  <p className="text-sm font-medium">Estimate</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {shippingMethod === "Delivery" ? "1–3 business days" : "Ready for pickup today"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border">
            <CardHeader>
              <CardTitle>Shipping & contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Country: Kenya</p>
              <select
                value={county}
                onChange={(event) => {
                  setCounty(event.target.value);
                  setTown("");
                  setTownInputMode("list");
                }}
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
              >
                <option value="">Select county</option>
                {KENYA_COUNTIES.map((item) => (
                  <option key={item.code} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium text-foreground">Town or area</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-lg px-2 text-xs"
                    disabled={!county}
                    onClick={() => {
                      setTownInputMode((mode) => (mode === "list" ? "manual" : "list"));
                      if (townInputMode === "list") setTown("");
                    }}
                  >
                    {townInputMode === "list" ? "Type a town or area" : "Choose from list"}
                  </Button>
                </div>
                {townInputMode === "manual" ? (
                  <Input
                    value={town}
                    disabled={!county}
                    onChange={(event) => setTown(event.target.value)}
                    placeholder="Type town, estate or area"
                  />
                ) : (
                  <select
                    value={town}
                    disabled={!county}
                    onChange={(event) => setTown(event.target.value)}
                    className="h-10 w-full rounded-xl border bg-background px-3 text-sm disabled:opacity-60"
                  >
                    <option value="">
                      {county ? "Select town or area" : "Select a county first"}
                    </option>
                    {availableTowns.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-muted-foreground">
                  {town && !availableTowns.includes(town)
                    ? "Manual location entered. Keep the estate or landmark in delivery instructions."
                    : "Use a major town or area, or type one if it is not listed."}
                </p>
              </div>
              <Input
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Street, building, house or shop number"
              />
              <Textarea
                value={shippingDetails}
                onChange={(e) => setShippingDetails(e.target.value)}
                rows={3}
                placeholder="Estate, landmark or delivery instructions"
              />
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Order notes or customer comments"
              />
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border">
            <CardHeader>
              <CardTitle>Coupon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon code"
                />
                <Button onClick={applyCoupon}>Apply</Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Use codes like SAVE5, PAYNOW5 or WELCOME10.
              </p>
              {couponMessage && <p className="text-sm text-muted-foreground">{couponMessage}</p>}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-3xl border-border">
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && <Skeleton className="h-48 rounded-3xl" />}
            {!isLoading && cart.items.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Your cart is empty. Build an order from the store preview or add a line item.
                </p>
                <Button variant="outline" onClick={() => navigate({ to: "/e-commerce/store" })}>
                  Go to store preview
                </Button>
              </div>
            )}
            {!isLoading && cart.items.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {cart.items.map((item) => {
                    const product = item.product_id ? productMap[item.product_id] : undefined;
                    const availableStock = item.product_id
                      ? Number(product?.stock_quantity ?? 0)
                      : 0;
                    const variantList = product?.id ? productVariants(product.id) : [];
                    return (
                      <Card key={item.id} className="rounded-3xl border-border">
                        <CardContent className="space-y-3">
                          <div className="grid gap-3">
                            <Select
                              value={item.product_id ?? ""}
                              onValueChange={(value) => handleProductChange(item.id, value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((productOption) => (
                                  <SelectItem key={productOption.id} value={productOption.id}>
                                    {productOption.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {variantList.length > 0 && item.product_id && (
                              <Select
                                value={item.variant_id ?? ""}
                                onValueChange={(value) => handleVariantChange(item.id, value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select variant" />
                                </SelectTrigger>
                                <SelectContent>
                                  {variantList.map((variant) => (
                                    <SelectItem key={variant.id} value={variant.id}>
                                      {variant.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            <div className="grid gap-3 sm:grid-cols-3">
                              <Input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) =>
                                  cart.updateItem(item.id, {
                                    quantity: Math.max(1, Number(e.target.value)),
                                  })
                                }
                                placeholder="Qty"
                              />
                              <Input value={money(item.unit_price)} readOnly />
                              <Input value={money(item.unit_cost)} readOnly />
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                              <p>{availableStock} in stock</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => cart.removeItem(item.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="rounded-3xl border border-border p-4 bg-muted/50">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{money(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{money(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>{money(Number(tax))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount</span>
                      <span>-{money(Number(discount))}</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between text-sm font-semibold">
                      <span>Total</span>
                      <span>{money(total)}</span>
                    </div>
                  </div>
                </div>

                <CardFooter className="flex flex-col gap-3">
                  <Button onClick={handleSubmit} disabled={!ready || saveOrder.isPending}>
                    {saveOrder.isPending ? "Saving order…" : "Place order"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => cart.clear()}
                    disabled={cart.items.length === 0}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" /> Empty cart
                  </Button>
                </CardFooter>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
