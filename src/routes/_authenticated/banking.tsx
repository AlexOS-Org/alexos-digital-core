import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, BriefcaseBusiness, CircleDollarSign, Plus, RefreshCw, Users, UserRoundPlus, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  createCrmContactFromBankingProspect,
  useBankingEmployers,
  useBankingProspects,
  useBankingSignals,
  useCreateBankingEmployer,
  type BankingProspect,
} from "@/lib/banking/api";

export const Route = createFileRoute("/_authenticated/banking")({
  component: BankingAcquisitionPage,
});

const priorityClass: Record<string, string> = {
  hot: "border-destructive/40 bg-destructive/10 text-destructive",
  high: "border-primary/40 bg-primary/10 text-primary",
  medium: "border-border bg-muted text-muted-foreground",
  low: "border-border bg-muted/50 text-muted-foreground",
};

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function BankingAcquisitionPage() {
  const employers = useBankingEmployers();
  const signals = useBankingSignals();
  const prospects = useBankingProspects();
  const createEmployer = useCreateBankingEmployer();
  const [showEmployerForm, setShowEmployerForm] = useState(false);
  const [crmBusyId, setCrmBusyId] = useState<string | null>(null);

  const hotEmployers = useMemo(
    () => (employers.data ?? []).filter((e) => e.priority === "hot" || e.priority === "high"),
    [employers.data],
  );

  const refresh = () => {
    void employers.refetch();
    void signals.refetch();
    void prospects.refetch();
  };

  const addToCrm = async (prospect: BankingProspect) => {
    if (prospect.crm_contact_id) return;
    setCrmBusyId(prospect.id);
    try {
      await createCrmContactFromBankingProspect(prospect);
      await prospects.refetch();
      toast.success("Prospect added to CRM");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add prospect to CRM");
    } finally {
      setCrmBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-primary"><LandmarkIcon /><span>Banking Acquisition Intelligence</span></div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Employer → Employee → Relationship</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Identify Nairobi employers with recurring recruitment, prioritise hiring signals, and move new-staff opportunities into the existing CRM without changing the CRM data model.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={refresh} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button type="button" onClick={() => setShowEmployerForm((v) => !v)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add employer
          </button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Priority employers" value={hotEmployers.length} icon={Building2} />
        <Metric label="Hiring signals" value={signals.data?.length ?? 0} icon={Zap} />
        <Metric label="Employee prospects" value={prospects.data?.length ?? 0} icon={Users} />
        <Metric label="CRM-linked" value={(prospects.data ?? []).filter((p) => p.crm_contact_id).length} icon={UserRoundPlus} />
      </div>

      {showEmployerForm && (
        <form
          className="grid gap-3 rounded-2xl border bg-card p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            try {
              await createEmployer.mutateAsync({
                company_name: String(form.get("company_name") ?? "").trim(),
                industry: String(form.get("industry") ?? "").trim() || null,
                location: String(form.get("location") ?? "Nairobi").trim() || "Nairobi",
                employee_count: Number(form.get("employee_count")) || null,
                recruitment_frequency: String(form.get("recruitment_frequency") ?? "unknown") as any,
                hiring_momentum_score: Number(form.get("score")) || 0,
                priority: String(form.get("priority") ?? "medium") as any,
                hr_contact_name: String(form.get("hr_contact_name") ?? "").trim() || null,
                hr_contact_phone: String(form.get("hr_contact_phone") ?? "").trim() || null,
                hr_contact_email: String(form.get("hr_contact_email") ?? "").trim() || null,
                notes: String(form.get("notes") ?? "").trim() || null,
              });
              toast.success("Employer added");
              setShowEmployerForm(false);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not create employer");
            }
          }}
        >
          <input name="company_name" required placeholder="Company name" className="rounded-lg border bg-background px-3 py-2 text-sm" />
          <input name="industry" placeholder="Industry" className="rounded-lg border bg-background px-3 py-2 text-sm" />
          <input name="location" defaultValue="Nairobi" placeholder="Location" className="rounded-lg border bg-background px-3 py-2 text-sm" />
          <input name="employee_count" type="number" min="0" placeholder="Approx. employees" className="rounded-lg border bg-background px-3 py-2 text-sm" />
          <select name="recruitment_frequency" defaultValue="regular" className="rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="unknown">Unknown</option><option value="occasional">Occasional</option><option value="regular">Regular</option><option value="frequent">Frequent</option><option value="mass">Mass recruitment</option>
          </select>
          <input name="score" type="number" min="0" max="100" defaultValue="50" placeholder="Hiring score" className="rounded-lg border bg-background px-3 py-2 text-sm" />
          <select name="priority" defaultValue="medium" className="rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="hot">Hot</option>
          </select>
          <input name="hr_contact_name" placeholder="HR contact" className="rounded-lg border bg-background px-3 py-2 text-sm" />
          <input name="hr_contact_phone" placeholder="HR phone" className="rounded-lg border bg-background px-3 py-2 text-sm" />
          <input name="hr_contact_email" type="email" placeholder="HR email" className="rounded-lg border bg-background px-3 py-2 text-sm" />
          <input name="notes" placeholder="Notes" className="rounded-lg border bg-background px-3 py-2 text-sm sm:col-span-2" />
          <button disabled={createEmployer.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{createEmployer.isPending ? "Saving…" : "Save employer"}</button>
        </form>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b p-4">
            <div><h2 className="font-semibold">Top employers to target</h2><p className="text-xs text-muted-foreground">Ranked by hiring momentum and acquisition priority.</p></div>
            <span className="text-xs text-muted-foreground">{employers.data?.length ?? 0} employers</span>
          </div>
          <div className="divide-y">
            {(employers.data ?? []).slice(0, 12).map((employer) => (
              <div key={employer.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{employer.company_name}</h3><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${priorityClass[employer.priority]}`}>{employer.priority}</span></div>
                  <p className="mt-1 text-xs text-muted-foreground">{employer.industry || "Industry not set"} · {employer.location || "Nairobi"} · {employer.recruitment_frequency}</p>
                </div>
                <div className="flex items-center gap-4 text-right"><div><div className="text-lg font-semibold">{employer.hiring_momentum_score}</div><div className="text-[10px] text-muted-foreground">momentum</div></div><div><div className="text-lg font-semibold">{employer.employee_count ?? "—"}</div><div className="text-[10px] text-muted-foreground">employees</div></div></div>
              </div>
            ))}
            {!employers.data?.length && <EmptyState text="Add your first recurring-recruitment employer." />}
          </div>
        </div>

        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-4"><h2 className="font-semibold">Recent hiring signals</h2><p className="text-xs text-muted-foreground">Use these as triggers for outreach.</p></div>
          <div className="divide-y">
            {(signals.data ?? []).slice(0, 8).map((signal) => (
              <div key={signal.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-sm font-medium">{signal.title}</div><div className="mt-1 text-xs text-muted-foreground">{signal.signal_type} · {signal.vacancy_count} vacancies · ~{signal.estimated_hires} hires</div></div><Zap className="h-4 w-4 shrink-0 text-primary" /></div></div>
            ))}
            {!signals.data?.length && <EmptyState text="No recruitment signals yet. The ingestion layer can populate this feed next." />}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b p-4"><div><h2 className="font-semibold">Employee acquisition pipeline</h2><p className="text-xs text-muted-foreground">Banking prospects remain separate from CRM until explicitly linked.</p></div><Link to="/people" className="text-sm font-medium text-primary hover:underline">Open CRM</Link></div>
        <div className="divide-y">
          {(prospects.data ?? []).slice(0, 10).map((prospect) => (
            <div key={prospect.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><div className="font-medium">{prospect.first_name} {prospect.last_name ?? ""}</div><div className="text-xs text-muted-foreground">{prospect.job_title || "Role not set"} · {prospect.stage.replaceAll("_", " ")}</div></div>
              {prospect.crm_contact_id ? <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">CRM linked</span> : <button type="button" onClick={() => addToCrm(prospect)} disabled={crmBusyId === prospect.id} className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"><UserRoundPlus className="h-3.5 w-3.5" />{crmBusyId === prospect.id ? "Linking…" : "Add to CRM"}</button>}
            </div>
          ))}
          {!prospects.data?.length && <EmptyState text="No employee prospects yet. Add prospects after a hiring signal or employer engagement." />}
        </div>
      </section>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <div className="flex items-start gap-3"><CircleDollarSign className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="font-medium">Credit is an opportunity layer, not an automatic approval engine.</p><p className="mt-1 text-xs text-muted-foreground">This module can surface customers who may be ready for additional products. Actual KYC, affordability, credit scoring, consent and lending decisions remain governed by the bank's approved policies and systems.</p></div></div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

function LandmarkIcon() {
  return <BriefcaseBusiness className="h-4 w-4" />;
}
