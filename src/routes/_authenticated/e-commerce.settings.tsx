import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Boxes, CheckCircle2, Palette, Save, ShieldCheck, Store } from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { VisualThemePicker } from "@/components/theme/VisualThemePicker";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAdminStorefront, useSaveAdminStorefront } from "@/lib/storefront/api";
import type { StorefrontSettings } from "@/lib/storefront/api";

export const Route = createFileRoute("/_authenticated/e-commerce/settings")({
  component: SettingsPage,
});

const DEFAULT_SETTINGS: StorefrontSettings = {
  slug: "dailygear",
  name: "DailyGear",
  tagline: "Smart, convenient gear for the way your day moves.",
  support_email: null,
  support_phone: null,
  whatsapp: null,
  currency: "KES",
  free_shipping_threshold: 0,
  flat_shipping_fee: 0,
  published: false,
};

function SettingsPage() {
  const { data: storefront, isLoading } = useAdminStorefront();
  const saveStorefront = useSaveAdminStorefront();
  const [form, setForm] = useState<StorefrontSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (storefront) {
      setForm({
        slug: storefront.slug,
        name: storefront.name,
        tagline: storefront.tagline,
        support_email: storefront.support_email,
        support_phone: storefront.support_phone,
        whatsapp: storefront.whatsapp,
        currency: storefront.currency,
        free_shipping_threshold: storefront.free_shipping_threshold,
        flat_shipping_fee: storefront.flat_shipping_fee,
        published: storefront.published,
      });
    }
  }, [storefront]);

  function update<K extends keyof StorefrontSettings>(key: K, value: StorefrontSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(published = form.published) {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Store name and public slug are required.");
      return;
    }

    try {
      await saveStorefront.mutateAsync({
        ...form,
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        tagline: form.tagline?.trim() || null,
        support_email: form.support_email?.trim() || null,
        support_phone: form.support_phone?.trim() || null,
        whatsapp: form.whatsapp?.trim() || null,
        currency: "KES",
        published,
      });
      setForm((current) => ({ ...current, published }));
      toast.success(published ? "DailyGear storefront published." : "Storefront settings saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save storefront settings.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="tap-target rounded-xl">
          <Link to="/e-commerce">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title="Commerce Settings"
          description="Configure the canonical DailyGear storefront before opening the public catalogue."
        />
      </div>

      <Card className="relative overflow-hidden rounded-[1.75rem] border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.07] shadow-[0_22px_60px_-36px_var(--alexos-glow)]">
        <div className="alexos-visual-strip absolute inset-x-0 top-0 h-1 opacity-90" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <Palette className="h-4 w-4" />
            </span>
            Workspace appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 rounded-2xl border border-primary/15 bg-primary/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <p className="text-sm font-semibold">Theme controls live in Settings</p>
              <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
                Choose AlexOS Midnight, Aurora, DailyGear Operator, Paper Light or a custom accent.
                The same preference applies across the AlexOS and DailyGear workspaces.
              </p>
            </div>
            <VisualThemePicker />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[1.75rem] border-primary/20 bg-card/80">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="h-4 w-4 text-primary" />
              Store identity and publication
            </CardTitle>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              This is the missing connection between your DailyGear catalogue and the public domain.
              Save it as a draft while preparing support details, or publish it when the catalogue
              is ready.
            </p>
          </div>
          {isLoading ? (
            <Skeleton className="h-6 w-24 rounded-full" />
          ) : (
            <Badge variant={form.published ? "default" : "outline"}>
              {form.published ? "Published" : "Draft"}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10 sm:col-span-2" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Store name" htmlFor="store-name">
                  <Input
                    id="store-name"
                    value={form.name}
                    onChange={(event) => update("name", event.target.value)}
                  />
                </Field>
                <Field
                  label="Public slug"
                  htmlFor="store-slug"
                  hint="Used internally for the existing dailygear.co.ke storefront."
                >
                  <Input
                    id="store-slug"
                    value={form.slug}
                    onChange={(event) => update("slug", event.target.value)}
                  />
                </Field>
                <Field label="Tagline" htmlFor="store-tagline" className="sm:col-span-2">
                  <Input
                    id="store-tagline"
                    value={form.tagline ?? ""}
                    onChange={(event) => update("tagline", event.target.value)}
                  />
                </Field>
              </div>

              <div className="grid gap-4 rounded-2xl border bg-muted/25 p-4 sm:grid-cols-3">
                <Field label="Support email" htmlFor="support-email">
                  <Input
                    id="support-email"
                    type="email"
                    placeholder="Add before launch"
                    value={form.support_email ?? ""}
                    onChange={(event) => update("support_email", event.target.value)}
                  />
                </Field>
                <Field label="Support phone" htmlFor="support-phone">
                  <Input
                    id="support-phone"
                    placeholder="Add before launch"
                    value={form.support_phone ?? ""}
                    onChange={(event) => update("support_phone", event.target.value)}
                  />
                </Field>
                <Field label="WhatsApp" htmlFor="store-whatsapp">
                  <Input
                    id="store-whatsapp"
                    placeholder="Add before launch"
                    value={form.whatsapp ?? ""}
                    onChange={(event) => update("whatsapp", event.target.value)}
                  />
                </Field>
              </div>

              <div className="grid gap-4 rounded-2xl border bg-muted/25 p-4 sm:grid-cols-2">
                <Field
                  label="Flat shipping fee (KES)"
                  htmlFor="flat-shipping-fee"
                  hint="Leave at 0 until a delivery fee is confirmed."
                >
                  <Input
                    id="flat-shipping-fee"
                    type="number"
                    min="0"
                    value={String(form.flat_shipping_fee ?? 0)}
                    onChange={(event) =>
                      update("flat_shipping_fee", Number(event.target.value) || 0)
                    }
                  />
                </Field>
                <Field
                  label="Free shipping threshold (KES)"
                  htmlFor="free-shipping-threshold"
                  hint="Leave at 0 to disable the threshold."
                >
                  <Input
                    id="free-shipping-threshold"
                    type="number"
                    min="0"
                    value={String(form.free_shipping_threshold ?? 0)}
                    onChange={(event) =>
                      update("free_shipping_threshold", Number(event.target.value) || 0)
                    }
                  />
                </Field>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-primary/15 bg-primary/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Public domain</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    https://dailygear.co.ke and www.dailygear.co.ke already route to the canonical
                    Worker.
                  </p>
                </div>
                <Button asChild variant="outline" className="rounded-xl">
                  <a href="https://dailygear.co.ke/shop" target="_blank" rel="noreferrer">
                    Open storefront
                  </a>
                </Button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => save(false)}
                  disabled={saveStorefront.isPending}
                >
                  <Save className="mr-2 h-4 w-4" /> Save draft
                </Button>
                <Button
                  className="rounded-xl"
                  onClick={() => save(true)}
                  disabled={saveStorefront.isPending}
                >
                  <Store className="mr-2 h-4 w-4" /> Publish storefront
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="rounded-[1.75rem] border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Publication policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <PolicyRow
              title="Verified source evidence"
              detail="Required before customer-facing product publication"
            />
            <PolicyRow
              title="15 units per SKU or colour variant"
              detail="Required for every new publication"
            />
            <PolicyRow
              title="Availability confirmed"
              detail="A source record must support the listing"
            />
          </CardContent>
        </Card>
        <Card className="rounded-[1.75rem] border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Boxes className="h-4 w-4 text-primary" />
              Catalogue workflow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <PolicyRow
              title="Add a real product"
              detail="Use Products to enter current price, stock and SEO fields"
            />
            <PolicyRow
              title="Attach evidence"
              detail="Keep first-party or current supplier provenance visible"
            />
            <PolicyRow title="Review readiness" detail="Publish only after all gates pass" />
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/e-commerce/products">Open Products</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/e-commerce/funnels">Open Funnels</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-[11px] leading-4 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function PolicyRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-background/45 p-3">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
