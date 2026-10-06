import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  CalendarCheck,
  ClipboardList,
  Clock3,
  Landmark,
  PhoneCall,
  Plus,
  Settings2,
  Users,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  calculateActivityMetrics,
  useBankingActivities,
  useCreateBankingActivity,
  type BankingActivityType,
} from "@/lib/banking/activity";
import { useBankingProspects } from "@/lib/banking/api";
import { useBusinessContext } from "@/lib/businesses/context";
import {
  useBankingProducts,
  useBankingProfile,
  useCreateBankingProduct,
  useSaveBankingProfile,
} from "@/lib/banking/growth";
import { useCreateBusiness } from "@/lib/businesses/api";

export const Route = createFileRoute("/_authenticated/banking")({
  component: BankingGrowthPage,
});

function BankingGrowthPage() {
  const { business, setBusiness } = useBusinessContext();
  const businessId = business?.id ?? null;
  const profile = useBankingProfile(businessId);
  const products = useBankingProducts(businessId, true);
  const activities = useBankingActivities(businessId);
  const prospects = useBankingProspects(businessId);
  const saveProfile = useSaveBankingProfile();
  const createProduct = useCreateBankingProduct();
  const createActivity = useCreateBankingActivity();
  const createBusiness = useCreateBusiness();
  const [showProductForm, setShowProductForm] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const activityMetrics = calculateActivityMetrics(activities.data ?? []);

  const handleCreateBusiness = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const created = await createBusiness.mutateAsync({
        name: businessName,
        business_type: "service",
      });
      setBusiness(created);
      setBusinessName("");
      toast.success(`${created.name} workspace created`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create business workspace");
    }
  };

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
              <form
                onSubmit={handleCreateBusiness}
                className="mt-6 flex max-w-xl flex-col gap-2 sm:flex-row"
              >
                <Input
                  required
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  placeholder="Enter your business name"
                  aria-label="Business name"
                />
                <Button type="submit" disabled={createBusiness.isPending} className="shrink-0">
                  <Plus className="mr-2 h-4 w-4" />
                  {createBusiness.isPending ? "Creating…" : "Create workspace"}
                </Button>
              </form>
              <p className="mt-2 text-xs text-muted-foreground">
                Your workspace is private to your account and will become the active Banking Growth
                workspace immediately.
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
        currency:
          String(data.get("currency") ?? "KES")
            .trim()
            .toUpperCase() || "KES",
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
        code: String(data.get("code") ?? "")
          .trim()
          .toLowerCase(),
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

  const handleActivity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const followUp = String(data.get("follow_up_at") ?? "").trim();
      await createActivity.mutateAsync({
        business_id: businessId,
        prospect_id: String(data.get("prospect_id") ?? "").trim() || null,
        activity_type: String(data.get("activity_type") ?? "call") as BankingActivityType,
        status: String(data.get("status") ?? "completed") as "planned" | "completed" | "cancelled",
        activity_date: String(data.get("activity_date") ?? new Date().toISOString().slice(0, 10)),
        subject: String(data.get("subject") ?? "").trim(),
        outcome: String(data.get("outcome") ?? "").trim() || null,
        notes: String(data.get("notes") ?? "").trim() || null,
        follow_up_at: followUp ? new Date(followUp).toISOString() : null,
      });
      toast.success("Activity recorded");
      event.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not record activity");
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
        <Badge variant="outline">{business?.name ?? "Business"}</Badge>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric
          icon={Landmark}
          label="Institution"
          value={profile.data?.institution_name ?? "Not configured"}
        />
        <Metric icon={Building2} label="Active products" value={products.data?.length ?? 0} />
        <Metric icon={CalendarCheck} label="Today" value={activityMetrics.today} />
        <Metric icon={Clock3} label="Follow-ups due" value={activityMetrics.followUpsDue} />
        <Metric icon={Users} label="This month" value={activityMetrics.thisMonth} />
      </div>

      <Card className="dashboard-surface rounded-xl">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary" /> Personal KCB activity
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Record calls, visits, meetings, follow-ups and customer conversations. Metrics are
              derived only from your recorded activity and stay inside this business workspace.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <PhoneCall className="h-4 w-4" /> {activityMetrics.completedToday} completed today
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <form
            onSubmit={handleActivity}
            className="grid gap-3 rounded-2xl border p-4 md:grid-cols-2 lg:grid-cols-4"
          >
            <select
              name="activity_type"
              defaultValue="call"
              className="rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="call">Call</option>
              <option value="visit">Visit</option>
              <option value="meeting">Meeting</option>
              <option value="follow_up">Follow-up</option>
              <option value="lead_contacted">Lead contacted</option>
              <option value="customer_conversation">Customer conversation</option>
              <option value="application">Application</option>
              <option value="referral">Referral</option>
              <option value="product_discussion">Product discussion</option>
              <option value="document_collection">Document collection</option>
            </select>
            <select
              name="status"
              defaultValue="completed"
              className="rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="completed">Completed</option>
              <option value="planned">Planned</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Input
              name="activity_date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
            <select
              name="prospect_id"
              defaultValue=""
              className="rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="">No linked prospect</option>
              {(prospects.data ?? []).map((prospect) => (
                <option key={prospect.id} value={prospect.id}>
                  {[prospect.first_name, prospect.last_name].filter(Boolean).join(" ")}
                </option>
              ))}
            </select>
            <Input
              name="subject"
              required
              placeholder="Activity subject"
              className="lg:col-span-2"
            />
            <Input name="follow_up_at" type="datetime-local" placeholder="Follow-up due" />
            <Input name="outcome" placeholder="Outcome / next step" />
            <Input name="notes" placeholder="Notes" className="md:col-span-2 lg:col-span-3" />
            <Button type="submit" disabled={createActivity.isPending}>
              {createActivity.isPending ? "Recording…" : "Record activity"}
            </Button>
          </form>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Activity</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Outcome</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(activities.data ?? []).slice(0, 8).map((activity) => (
                    <tr key={activity.id}>
                      <td className="p-3 text-xs text-muted-foreground">
                        {activity.activity_date}
                      </td>
                      <td className="p-3 capitalize">
                        {activity.activity_type.replaceAll("_", " ")}
                      </td>
                      <td className="p-3 font-medium">{activity.subject}</td>
                      <td className="max-w-[240px] truncate p-3 text-muted-foreground">
                        {activity.outcome ?? "—"}
                      </td>
                      <td className="p-3">
                        <Badge variant={activity.status === "completed" ? "secondary" : "outline"}>
                          {activity.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!activities.data?.length ? (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  No personal activity recorded yet.
                </p>
              ) : null}
            </div>
            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="font-medium">Personal scorecard</p>
              <div className="mt-4 space-y-3 text-sm">
                <ScoreRow label="This week" value={activityMetrics.thisWeek} />
                <ScoreRow label="This month" value={activityMetrics.thisMonth} />
                <ScoreRow label="Prospects contacted" value={activityMetrics.prospectsContacted} />
                <ScoreRow label="Follow-ups due" value={activityMetrics.followUpsDue} />
              </div>
              <Button asChild variant="outline" className="mt-5 w-full">
                <Link to="/banking/performance">Open KCB performance dashboard</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
              Product rates, eligibility and financing limits remain configurable data. Do not enter
              assumptions as contractual bank terms.
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-surface rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Acquisition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-6 text-muted-foreground">
              Continue using the existing employer → employee acquisition workflow, now isolated to
              the active business.
            </p>
            <Button asChild className="w-full">
              <Link to="/banking/acquisition">Open acquisition workspace</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="dashboard-surface rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">KPI & Performance</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm leading-6 text-muted-foreground">
              Configure contractual and internal targets, record monthly actuals, and track weighted
              achievement.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Performance snapshots are structured for future commission workflows without
              hard-coded commission rules.
            </p>
          </div>
          <Button asChild>
            <Link to="/banking/performance">Open performance workspace</Link>
          </Button>
        </CardContent>
      </Card>

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
            <form
              onSubmit={handleProduct}
              className="grid gap-3 rounded-2xl border p-4 sm:grid-cols-2 lg:grid-cols-3"
            >
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
              <Input
                name="max_financing"
                type="number"
                min="0"
                max="100"
                placeholder="Max financing %"
              />
              <Input name="source_url" type="url" placeholder="Official source URL (optional)" />
              <Input
                name="description"
                placeholder="Description"
                className="sm:col-span-2 lg:col-span-3"
              />
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
                      <p className="text-xs text-muted-foreground">
                        {product.code} · {product.category}
                      </p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  {product.target_segment ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Target: {product.target_segment}
                    </p>
                  ) : null}
                  {product.description ? (
                    <p className="mt-2 text-sm leading-5 text-muted-foreground">
                      {product.description}
                    </p>
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

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
