import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Landmark, Plus, Settings2, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBusinessContext } from "@/lib/businesses/context";
import {
  useBankingProducts,
  useBankingProfile,
  useCreateBankingProduct,
  useSaveBankingProfile,
} from "@/lib/banking/growth";

export const Route = createFileRoute("/_authenticated/banking")({
  component: BankingGrowthPage,
});

function BankingGrowthPage() {
  const { business } = useBusinessContext();
  const businessId = business?.id ?? null;
  const profile = useBankingProfile(businessId);
  const products = useBankingProducts(businessId, true);
  const saveProfile = useSaveBankingProfile();
  const createProduct = useCreateBankingProduct();
  const [showProductForm, setShowProductForm] = useState(false);

  if (!businessId) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="dashboard-feature-surface rounded-xl p-6 sm:p-8">
          <div className="flex gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-primary/15 bg-background/80 text-primary">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <p className="dashboard-eyebrow mb-1">Banking Growth</p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Select a business workspace
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Banking configuration is business-scoped. Select a business first so products,
                acquisition activity and future financing records stay isolated correctly.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await saveProfile.mutateAsync({
        business_id: businessId,
        institution_name: String(data.get("institution_name") ?? "").trim(),
        institution_code: String(data.get("institution_code") ?? "").trim() || null,
        role_title: String(data.get("role_title") ?? "").trim() || null,
        currency: String(data.get("currency") ?? "KES").trim().toUpperCase() || "KES",
        notes: String(data.get("notes") ?? "").trim() || null,
      });
      toast.success("Banking profile saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save banking profile");
    }
  };

  const handleProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await createProduct.mutateAsync({
        business_id: businessId,
        code: String(data.get("code") ?? "").trim().toLowerCase(),
        name: String(data.get("name") ?? "").trim(),
        category: String(data.get("category") ?? "").trim(),
        description: String(data.get("description") ?? "").trim() || null,
        target_segment: String(data.get("target_segment") ?? "").trim() || null,
        eligibility_summary: String(data.get("eligibility") ?? "").trim() || null,
        min_amount: Number(data.get("min_amount")) || null,
        max_amount: Number(data.get("max_amount")) || null,
        min_term_months: Number(data.get("min_term")) || null,
        max_term_months: Number(data.get("max_term")) || null,
        max_financing_percent: Number(data.get("max_financing")) || null,
        rate_label: String(data.get("rate_label") ?? "").trim() || null,
        source_url: String(data.get("source_url") ?? "").trim() || null,
        active: true,
        sort_order: products.data?.length ?? 0,
      });
      toast.success("Banking product added");
      event.currentTarget.reset();
      setShowProductForm(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add banking product");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="dashboard-eyebrow mb-1">Banking Growth</p>
          <h1 className="text-3xl font-semibold tracking-tight">Banking Command Workspace</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Build customer relationships around deposits, lending, asset finance and cross-sell
            products without hard-coding institution terms into AlexOS.
          </p>
        </div>
        <Badge variant="outline">{business.name}</Badge>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric icon={Landmark} label="Institution" value={profile.data?.institution_name ?? "Not configured"} />
        <Metric icon={Building2} label="Active products" value={products.data?.length ?? 0} />
        <Metric icon={Users} label="Acquisition workspace" value="Ready" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="dashboard-surface rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Institution profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfile} className="grid gap-3 sm:grid-cols-2">
              <Input
                required
                name="institution_name"
                defaultValue={profile.data?.institution_name ?? ""}
                placeholder="Institution name"
              />
              <Input
                name="institution_code"
                defaultValue={profile.data?.institution_code ?? ""}
                placeholder="Institution code (optional)"
              />
              <Input
                name="role_title"
                defaultValue={profile.data?.role_title ?? ""}
                placeholder="Role title"
              />
              <Input
                name="currency"
                defaultValue={profile.data?.currency ?? "KES"}
                placeholder="Currency"
              />
              <Input
                name="notes"
                defaultValue={profile.data?.notes ?? ""}
                placeholder="Profile notes"
                className="sm:col-span-2"
              />
              <Button type="submit" disabled={saveProfile.isPending} className="sm:col-span-2">
                <Settings2 className="mr-2 h-4 w-4" />
                {saveProfile.isPending ? "Saving…" : "Save profile"}
              </Button>
            </form>
            <p className="mt-3 text-xs text-muted-foreground">
              Product rates, eligibility and financing limits remain configurable data. Do not
              enter assumptions as contractual bank terms.
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-surface rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Acquisition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-6 text-muted-foreground">
              Continue using the existing employer → employee acquisition workflow, now isolated
              to the active business.
            </p>
            <Button asChild className="w-full">
              <Link to="/banking/acquisition">Open acquisition workspace</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="dashboard-surface rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Product catalog</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Configurable catalog for the current institution and business.
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowProductForm((value) => !value)}>
            <Plus className="mr-2 h-4 w-4" />
            Add product
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showProductForm ? (
            <form onSubmit={handleProduct} className="grid gap-3 rounded-2xl border p-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input required name="code" placeholder="Product code" />
              <Input required name="name" placeholder="Product name" />
              <Input required name="category" placeholder="Category e.g. Lending" />
              <Input name="target_segment" placeholder="Target segment" />
              <Input name="eligibility" placeholder="Eligibility summary" />
              <Input name="rate_label" placeholder="Rate label (optional)" />
              <Input name="min_amount" type="number" min="0" placeholder="Minimum amount" />
              <Input name="max_amount" type="number" min="0" placeholder="Maximum amount" />
              <Input name="min_term" type="number" min="0" placeholder="Minimum term (months)" />
              <Input name="max_term" type="number" min="0" placeholder="Maximum term (months)" />
              <Input name="max_financing" type="number" min="0" max="100" placeholder="Max financing %" />
              <Input name="source_url" type="url" placeholder="Official source URL (optional)" />
              <Input name="description" placeholder="Description" className="sm:col-span-2 lg:col-span-3" />
              <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={createProduct.isPending}>
                  {createProduct.isPending ? "Adding…" : "Add product"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowProductForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}

          {products.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading products…</p>
          ) : products.data?.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {products.data.map((product) => (
                <div key={product.id} className="rounded-2xl border border-border/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.code} · {product.category}</p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  {product.target_segment ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Target: {product.target_segment}
                    </p>
                  ) : null}
                  {product.description ? (
                    <p className="mt-2 text-sm leading-5 text-muted-foreground">{product.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <Landmark className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No products configured</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add verified institution products here. Phase 2 does not seed assumed KCB terms.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Landmark;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="alexos-data-metric rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <p className="dashboard-eyebrow text-[10px]">{label}</p>
        </div>
        <p className="mt-2 truncate text-lg font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
