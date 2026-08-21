import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Boxes, CheckCircle2, Palette, ShieldCheck, Store } from "lucide-react";
import { VisualThemePicker } from "@/components/theme/VisualThemePicker";
import { PageHeader } from "@/components/dailygear/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export const Route = createFileRoute("/_authenticated/e-commerce/settings")({
  component: SettingsPage,
});
function SettingsPage() {
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
          description="Appearance, store identity, catalogue policy and operating preferences."
        />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
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
                  Choose AlexOS Midnight, Aurora, DailyGear Operator, Paper Light or a custom
                  accent. The same preference applies across the AlexOS and DailyGear workspaces.
                </p>
              </div>
              <VisualThemePicker />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[1.75rem] border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="h-4 w-4 text-primary" />
              Store identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <SettingRow label="Business" value="DailyGear" />
            <SettingRow label="Currency" value="Kenya Shilling (KES)" />
            <SettingRow label="Timezone" value="East Africa Time (UTC+3)" />
            <SettingRow label="Storefront" value="dailygear.co.ke" />
          </CardContent>
        </Card>
      </div>
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
              title="Current source evidence"
              detail="Required before customer-facing publication"
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
            <Button asChild variant="outline" className="mt-2 w-full rounded-xl">
              <Link to="/e-commerce/products">Open Products</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/50 px-3 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-xs font-semibold">{value}</span>
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
