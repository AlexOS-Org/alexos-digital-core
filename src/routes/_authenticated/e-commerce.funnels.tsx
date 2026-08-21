import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, GitBranch, Plus, Save, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/dailygear/PageHeader";
import {
  useDeleteFunnel,
  useDeleteFunnelStep,
  useFunnelSteps,
  useFunnels,
  useProducts,
  useSaveFunnel,
  useSaveFunnelStep,
} from "@/lib/dailygear/api";
import type { Funnel, FunnelStep } from "@/lib/dailygear/types";
import {
  defaultFunnelLandingContent,
  parseFunnelLandingContent,
  serializeFunnelLandingContent,
  type FunnelLandingContent,
} from "@/lib/storefront/funnel-copy";
import { formatMoney, useStorefront } from "@/lib/storefront/api";

export const Route = createFileRoute("/_authenticated/e-commerce/funnels")({
  head: () => ({
    meta: [
      { title: "Funnels | DailyGear" },
      {
        name: "description",
        content: "Configure DailyGear product funnels using the canonical catalogue and checkout.",
      },
    ],
  }),
  component: FunnelsPage,
});

type FormState = {
  name: string;
  slug: string;
  productId: string;
  trafficSource: string;
  status: string;
  thankYouHeading: string;
  thankYouBody: string;
};

type OfferConfig = {
  orderBump: boolean;
  orderBumpProductId: string;
  upsell: boolean;
  upsellProductId: string;
  downsell: boolean;
  downsellProductId: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  productId: "",
  trafficSource: "Meta Ads",
  status: "draft",
  thankYouHeading: "Thank you for your DailyGear order",
  thankYouBody: "Your order details and tracking information will be available after checkout.",
};

const EMPTY_OFFERS: OfferConfig = {
  orderBump: false,
  orderBumpProductId: "",
  upsell: false,
  upsellProductId: "",
  downsell: false,
  downsellProductId: "",
};

const EMPTY_LANDING = defaultFunnelLandingContent("Your DailyGear essential");

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function stepFor(steps: FunnelStep[], type: string) {
  return steps.find((step) => step.step_type === type && step.enabled);
}

function FunnelsPage() {
  const { data: store, isLoading: storeLoading } = useStorefront();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: funnels = [], isLoading: funnelsLoading } = useFunnels(
    store?.id ? { storefront_id: store.id } : undefined,
    Boolean(store?.id),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [landing, setLanding] = useState<FunnelLandingContent>(EMPTY_LANDING);
  const [offers, setOffers] = useState<OfferConfig>(EMPTY_OFFERS);
  const stepsQuery = useFunnelSteps(selectedId ?? undefined);
  const saveFunnel = useSaveFunnel();
  const saveStep = useSaveFunnelStep();
  const deleteStep = useDeleteFunnelStep();
  const deleteFunnel = useDeleteFunnel();

  const selectedProduct = products.find((product) => product.id === form.productId) ?? null;
  const offerProducts = useMemo(
    () => products.filter((product) => product.id !== form.productId),
    [products, form.productId],
  );

  useEffect(() => {
    const funnel = funnels.find((item) => item.id === selectedId);
    if (!funnel) return;
    setForm({
      name: funnel.name,
      slug: funnel.slug,
      productId: funnel.product_id,
      trafficSource: funnel.traffic_source ?? "",
      status: funnel.status,
      thankYouHeading: funnel.thank_you_heading ?? EMPTY_FORM.thankYouHeading,
      thankYouBody: funnel.thank_you_body ?? EMPTY_FORM.thankYouBody,
    });
  }, [funnels, selectedId]);

  useEffect(() => {
    const steps = stepsQuery.data ?? [];
    setOffers({
      orderBump: Boolean(stepFor(steps, "order_bump")),
      orderBumpProductId: stepFor(steps, "order_bump")?.product_id ?? "",
      upsell: Boolean(stepFor(steps, "upsell")),
      upsellProductId: stepFor(steps, "upsell")?.product_id ?? "",
      downsell: Boolean(stepFor(steps, "downsell")),
      downsellProductId: stepFor(steps, "downsell")?.product_id ?? "",
    });
    setLanding(
      parseFunnelLandingContent(
        stepFor(steps, "landing")?.body,
        selectedProduct?.name ?? "Your DailyGear essential",
      ),
    );
  }, [selectedId, stepsQuery.data, selectedProduct?.name]);

  function startNew() {
    setSelectedId(null);
    setForm(EMPTY_FORM);
    setLanding(EMPTY_LANDING);
    setOffers(EMPTY_OFFERS);
  }

  function selectFunnel(funnel: Funnel) {
    setSelectedId(funnel.id);
  }

  async function save() {
    if (!store?.id) {
      toast.error("Publish a DailyGear storefront before creating a funnel.");
      return;
    }
    if (!form.name.trim() || !form.productId) {
      toast.error("A funnel name and canonical product are required.");
      return;
    }
    const slug = slugify(form.slug || form.name);
    if (!slug) {
      toast.error("Add a valid funnel slug.");
      return;
    }
    if (offers.orderBump && !offers.orderBumpProductId) {
      toast.error("Choose a product for the order bump.");
      return;
    }
    if (offers.upsell && !offers.upsellProductId) {
      toast.error("Choose a product for the upsell.");
      return;
    }
    if (offers.downsell && (!offers.downsellProductId || !offers.upsell)) {
      toast.error("A downsell requires an upsell and a downsell product.");
      return;
    }

    try {
      const saved = await saveFunnel.mutateAsync({
        id: selectedId ?? undefined,
        storefront_id: store.id,
        name: form.name.trim(),
        slug,
        product_id: form.productId,
        traffic_source: form.trafficSource.trim() || null,
        status: form.status,
        thank_you_heading: form.thankYouHeading.trim() || null,
        thank_you_body: form.thankYouBody.trim() || null,
      });

      const nextSteps = [
        {
          step_type: "landing",
          title: landing.headline,
          body: serializeFunnelLandingContent(landing),
          product_id: null,
        },
        {
          step_type: "checkout",
          title: "Fast guest checkout",
          body: "The existing DailyGear checkout with server-side price and stock verification.",
          product_id: null,
        },
        ...(offers.orderBump
          ? [
              {
                step_type: "order_bump",
                title: "Add this useful extra",
                body: "Optional add-on shown inside checkout.",
                product_id: offers.orderBumpProductId,
              },
            ]
          : []),
        ...(offers.upsell
          ? [
              {
                step_type: "upsell",
                title: "Add another DailyGear essential",
                body: "Optional post-purchase offer. Payment remains explicit unless a provider confirms one-click capability.",
                product_id: offers.upsellProductId,
              },
            ]
          : []),
        ...(offers.downsell
          ? [
              {
                step_type: "downsell",
                title: "A simpler alternative",
                body: "Optional fallback shown only when the upsell is declined.",
                product_id: offers.downsellProductId,
              },
            ]
          : []),
        {
          step_type: "thank_you",
          title: form.thankYouHeading.trim() || "Thank you for your DailyGear order",
          body: form.thankYouBody.trim() || null,
          product_id: null,
        },
      ];
      const existingSteps = stepsQuery.data ?? [];
      const desiredIds = new Set<string>();
      for (const [position, step] of nextSteps.entries()) {
        const existing = existingSteps.find((item) => item.step_type === step.step_type);
        const savedStep = await saveStep.mutateAsync({
          id: existing?.id,
          funnel_id: saved.id,
          user_id: saved.user_id,
          step_type: step.step_type,
          position,
          enabled: true,
          title: step.title,
          body: step.body,
          product_id: step.product_id,
          discount_type: "none",
          discount_value: 0,
        });
        desiredIds.add(savedStep.id);
      }
      await Promise.all(
        existingSteps
          .filter((step) => !desiredIds.has(step.id))
          .map((step) => deleteStep.mutateAsync(step.id)),
      );
      setSelectedId(saved.id);
      setForm((previous) => ({ ...previous, slug }));
      toast.success("Funnel configuration saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save funnel");
    }
  }

  async function remove() {
    if (!selectedId) return;
    if (!window.confirm("Remove this funnel configuration?")) return;
    await deleteFunnel.mutateAsync(selectedId);
    startNew();
  }

  const loading = storeLoading || productsLoading || funnelsLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Funnels"
        description="Build focused product journeys for paid traffic while keeping DailyGear’s normal shop and checkout unchanged."
        actions={
          <Button variant="outline" className="rounded-xl" onClick={startNew}>
            <Plus className="mr-2 h-4 w-4" /> New funnel
          </Button>
        }
      />

      <section className="alexos-mesh relative overflow-hidden rounded-3xl border p-5 sm:p-6">
        <div className="relative z-10 grid gap-5 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/12">
                <GitBranch className="h-5 w-5" />
              </span>
              <p className="text-xs font-bold uppercase tracking-[0.18em]">Native funnel engine</p>
            </div>
            <h2 className="mt-3 max-w-2xl text-2xl font-black tracking-tight sm:text-3xl">
              One catalogue. One checkout. More intentional customer journeys.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Funnels reference the canonical DailyGear product record. Offers remain optional, and
              every accepted line is checked by the same inventory and order transaction.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {["Canonical product", "Atomic stock", "Honest payment state"].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-2xl border bg-card/75 px-3 py-2.5 text-sm"
              >
                <Check className="h-4 w-4 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!store && !loading ? (
        <Card className="rounded-3xl">
          <CardContent className="p-6">
            <p className="font-semibold">A published DailyGear storefront is required.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create or publish the storefront in DailyGear Settings before configuring a
              customer-facing funnel.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <Card className="rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Configurations</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Drafts stay private until published.
              </p>
            </div>
            <Badge variant="outline">{funnels.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading funnel configurations…</p>
            ) : funnels.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                No funnel configurations yet. Create one when a verified product is ready for a
                campaign.
              </div>
            ) : (
              funnels.map((funnel) => {
                const product = products.find((item) => item.id === funnel.product_id);
                return (
                  <button
                    key={funnel.id}
                    type="button"
                    onClick={() => selectFunnel(funnel)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${selectedId === funnel.id ? "border-primary bg-primary/8 shadow-sm" : "hover:bg-muted/50"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0 truncate text-sm font-semibold">{funnel.name}</span>
                      <Badge variant={funnel.status === "published" ? "secondary" : "outline"}>
                        {funnel.status}
                      </Badge>
                    </div>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {product?.name ?? "Product unavailable"}
                    </span>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>{selectedId ? "Edit funnel" : "Create funnel"}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                The public route is generated from this configuration and canonical commerce data.
              </p>
            </div>
            {selectedId ? (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => void remove()}
                aria-label="Remove funnel"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="funnel-name">Funnel name</Label>
                <Input
                  id="funnel-name"
                  value={form.name}
                  placeholder="150W Car Inverter campaign"
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, name: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="funnel-slug">Public slug</Label>
                <Input
                  id="funnel-slug"
                  value={form.slug}
                  placeholder="150w-car-inverter"
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, slug: slugify(event.target.value) }))
                  }
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="funnel-product">Canonical product</Label>
                <select
                  id="funnel-product"
                  value={form.productId}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, productId: event.target.value }))
                  }
                  className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a DailyGear product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ·{" "}
                      {formatMoney(Number(product.price ?? 0), product.currency ?? "KES")} ·{" "}
                      {product.status}
                    </option>
                  ))}
                </select>
                {selectedProduct ? (
                  <p className="text-xs text-muted-foreground">
                    {selectedProduct.status === "active"
                      ? "Eligible for a public funnel when stock is available."
                      : "Draft product: this funnel will remain private until the product is published."}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="funnel-source">Traffic source</Label>
                <Input
                  id="funnel-source"
                  value={form.trafficSource}
                  placeholder="Meta Ads"
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, trafficSource: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="funnel-status">Status</Label>
                <select
                  id="funnel-status"
                  value={form.status}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, status: event.target.value }))
                  }
                  className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <section className="space-y-4 rounded-2xl border bg-muted/25 p-4">
              <div>
                <h3 className="text-sm font-semibold">Landing page content</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  This is the landing step of the funnel. Keep the promise clear, use only verified
                  product details and let the same checkout handle the order.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="landing-eyebrow">Eyebrow</Label>
                  <Input
                    id="landing-eyebrow"
                    value={landing.eyebrow}
                    onChange={(event) =>
                      setLanding((previous) => ({ ...previous, eyebrow: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="landing-cta">Primary CTA</Label>
                  <Input
                    id="landing-cta"
                    value={landing.ctaLabel}
                    onChange={(event) =>
                      setLanding((previous) => ({ ...previous, ctaLabel: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="landing-headline">Headline</Label>
                  <Input
                    id="landing-headline"
                    value={landing.headline}
                    onChange={(event) =>
                      setLanding((previous) => ({ ...previous, headline: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="landing-subheadline">Subheadline</Label>
                  <Textarea
                    id="landing-subheadline"
                    value={landing.subheadline}
                    onChange={(event) =>
                      setLanding((previous) => ({ ...previous, subheadline: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="landing-delivery">Delivery and payment note</Label>
                  <Textarea
                    id="landing-delivery"
                    value={landing.deliveryNote}
                    onChange={(event) =>
                      setLanding((previous) => ({ ...previous, deliveryNote: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {landing.benefits.map((benefit, index) => (
                  <div
                    key={`landing-benefit-${index}`}
                    className="space-y-2 rounded-2xl border bg-card p-3"
                  >
                    <Label htmlFor={`landing-benefit-title-${index}`}>Benefit {index + 1}</Label>
                    <Input
                      id={`landing-benefit-title-${index}`}
                      value={benefit.title}
                      onChange={(event) =>
                        setLanding((previous) => ({
                          ...previous,
                          benefits: previous.benefits.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, title: event.target.value } : item,
                          ),
                        }))
                      }
                    />
                    <Textarea
                      aria-label={`Benefit ${index + 1} explanation`}
                      value={benefit.body}
                      onChange={(event) =>
                        setLanding((previous) => ({
                          ...previous,
                          benefits: previous.benefits.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, body: event.target.value } : item,
                          ),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Trust points</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {landing.proof.map((point, index) => (
                    <Input
                      key={`landing-proof-${index}`}
                      aria-label={`Trust point ${index + 1}`}
                      value={point}
                      onChange={(event) =>
                        setLanding((previous) => ({
                          ...previous,
                          proof: previous.proof.map((item, itemIndex) =>
                            itemIndex === index ? event.target.value : item,
                          ),
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border bg-muted/25 p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold">Optional conversion steps</h3>
                  <p className="text-xs text-muted-foreground">
                    Use only when the offer is relevant to the canonical product.
                  </p>
                </div>
              </div>
              <OfferSelector
                label="Order bump"
                description="Shown inside checkout and added to the same order."
                enabled={offers.orderBump}
                productId={offers.orderBumpProductId}
                products={offerProducts}
                onToggle={(enabled) =>
                  setOffers((previous) => ({ ...previous, orderBump: enabled }))
                }
                onProductChange={(productId) =>
                  setOffers((previous) => ({ ...previous, orderBumpProductId: productId }))
                }
              />
              <OfferSelector
                label="Upsell"
                description="Shown after the initial order with an explicit next action."
                enabled={offers.upsell}
                productId={offers.upsellProductId}
                products={offerProducts}
                onToggle={(enabled) => setOffers((previous) => ({ ...previous, upsell: enabled }))}
                onProductChange={(productId) =>
                  setOffers((previous) => ({ ...previous, upsellProductId: productId }))
                }
              />
              <OfferSelector
                label="Downsell"
                description="Shown only after an upsell decline; requires an upsell."
                enabled={offers.downsell}
                productId={offers.downsellProductId}
                products={offerProducts}
                onToggle={(enabled) =>
                  setOffers((previous) => ({ ...previous, downsell: enabled }))
                }
                onProductChange={(productId) =>
                  setOffers((previous) => ({ ...previous, downsellProductId: productId }))
                }
              />
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="thank-you-heading">Thank-you heading</Label>
                <Input
                  id="thank-you-heading"
                  value={form.thankYouHeading}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, thankYouHeading: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="thank-you-body">Thank-you message</Label>
                <Textarea
                  id="thank-you-body"
                  value={form.thankYouBody}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, thankYouBody: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold">Ready to save the journey?</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Publishing still requires the product’s existing availability and stock
                  safeguards.
                </p>
              </div>
              <Button
                className="rounded-xl"
                disabled={saveFunnel.isPending || saveStep.isPending}
                onClick={() => void save()}
              >
                <Save className="mr-2 h-4 w-4" /> Save configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedId ? (
        <p className="text-xs text-muted-foreground">
          Public test path:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">/funnel/{form.slug || "your-slug"}</code>
          <ArrowRight className="mx-1 inline h-3 w-3" />
          Product landing page, then the existing DailyGear checkout.
        </p>
      ) : null}
    </div>
  );
}

function OfferSelector({
  label,
  description,
  enabled,
  productId,
  products,
  onToggle,
  onProductChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  productId: string;
  products: ReturnType<typeof useProducts>["data"] extends (infer Item)[] | undefined
    ? Item[]
    : never;
  onToggle: (enabled: boolean) => void;
  onProductChange: (productId: string) => void;
}) {
  return (
    <div className="rounded-2xl border bg-card p-3">
      <div className="flex items-start gap-3">
        <input
          id={`offer-${label}`}
          type="checkbox"
          checked={enabled}
          onChange={(event) => onToggle(event.target.checked)}
          className="mt-1 h-4 w-4 accent-[var(--primary)]"
        />
        <div className="min-w-0 flex-1">
          <Label htmlFor={`offer-${label}`} className="cursor-pointer text-sm font-semibold">
            {label}
          </Label>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          {enabled ? (
            <select
              aria-label={`${label} product`}
              value={productId}
              onChange={(event) => onProductChange(event.target.value)}
              className="mt-2 h-9 w-full rounded-lg border bg-background px-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select offer product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ·{" "}
                  {formatMoney(Number(product.price ?? 0), product.currency ?? "KES")}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>
    </div>
  );
}
