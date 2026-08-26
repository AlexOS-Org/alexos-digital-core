import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Plus, RefreshCw, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  createCrmContactFromBankingProspect,
  useBankingEmployers,
  useBankingProspects,
  useBankingSignals,
  useCreateBankingEmployer,
  type BankingProspect,
} from "@/lib/banking/api";

export const Route = createFileRoute("/_authenticated/banking/acquisition")({
  component: BankingAcquisitionPage,
});

function BankingAcquisitionPage() {
  const employers = useBankingEmployers();
  const signals = useBankingSignals();
  const prospects = useBankingProspects();
  const createEmployer = useCreateBankingEmployer();
  const [openForm, setOpenForm] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  const priorityEmployers = useMemo(
    () => (employers.data ?? []).filter((item) => item.priority === "hot" || item.priority === "high"),
    [employers.data],
  );

  const refresh = () => {
    void employers.refetch();
    void signals.refetch();
    void prospects.refetch();
  };

  const linkToCrm = async (prospect: BankingProspect) => {
    if (prospect.crm_contact_id) return;
    setLinkingId(prospect.id);
    try {
      await createCrmContactFromBankingProspect(prospect);
      await prospects.refetch();
      toast.success("Employee prospect linked to CRM");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not link prospect");
    } finally {
      setLinkingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Banking Acquisition Intelligence</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Employer → Employee → Relationship</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Find employers with recurring recruitment in Nairobi, prioritise hiring signals, and move employee prospects into the existing CRM only when you choose to link them.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={refresh} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button type="button" onClick={() => setOpenForm((value) => !value)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
            <Plus className="h-4 w-4" /> Add employer
          </button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric icon={Building2} label="Priority employers" value={priorityEmployers.length} />
        <Metric icon={Zap} label="Active hiring signals" value={signals.data?.length ?? 0} />
        <Metric icon={Users} label="Employee prospects" value={prospects.data?.length ?? 0} />
      </div>

      {openForm && (
        <form
          className="grid gap-3 rounded-2xl border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            try {
              await createEmployer.mutateAsync({
                company_name: String(data.get("company_name") ?? "").trim(),
                industry: String(data.get("industry") ?? "").trim() || null,
                location: String(data.get("location") ?? "Nairobi").trim() || "Nairobi",
                employee_count: Number(data.get("employee_count")) || null,
                recruitment_frequency: String(data.get("frequency") ?? "regular") as any,
                hiring_momentum_score: Math.max(0, Math.min(100, Number(data.get("score")) || 50)),
                priority: String(data.get("priority") ?? "medium") as any,
                hr_contact_name: String(data.get("hr") ?? "").trim() || null,
                hr_contact_phone: null,
                hr_contact_email: null,
                notes: String(data.get("notes") ?? "").trim() || null,
              });
              toast.success("Employer added");
              setOpenForm(false);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not add employer");
            }
          }}
        >
          <input required name="company_name" placeholder="Company name" className="rounded-lg border bg-background px-3 py-2 text-sm" />
          <input name="industry" placeholder="Industry" className="rounded-lg border bg-background px-3 py-2 text-sm" />
          <input name="location" defaultValue="Nairobi" placeholder="Location" className="rounded-lg border bg-background px-3 py-2 text-sm" />
          <input name="employee_count" type="number" min="0" placeholder="Approx. employees" className="rounded-lg border bg-background px-3 py-2 text-sm" />
          <select name="frequency" defaultValue="regular" className="rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="unknown">Unknown</option><option value="occasional">Occasional</option><option value="regular">Regular</option><option value="frequent">Frequent</option><option value="mass">Mass</option>
          </select>
          <select name="priority" defaultValue="medium" className="rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="hot">Hot</option>
          </select>
          <input name="score" type="number" min="0" max="100" defaultValue="50" placeholder="Hiring momentum" className="rounded-lg border bg-background px-3 py-2 text-sm" />
          <input name="hr" placeholder="HR contact" className="rounded-lg border bg-background px-3 py-2 text-sm" />
          <input name="notes" placeholder="Notes" className="rounded-lg border bg-background px-3 py-2 text-sm sm:col-span-2" />
          <button disabled={createEmployer.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {createEmployer.isPending ? "Saving…" : "Save employer"}
          </button>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card">
          <div className="border-b p-4"><h2 className="font-semibold">Employers to target</h2><p className="text-xs text-muted-foreground">Prioritised by hiring momentum.</p></div>
          <div className="divide-y">
            {(employers.data ?? []).slice(0, 12).map((employer) => (
              <div key={employer.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0"><p className="font-medium">{employer.company_name}</p><p className="text-xs text-muted-foreground">{employer.industry || "Industry not set"} · {employer.location || "Nairobi"}</p></div>
                <div className="text-right"><p className="font-semibold">{employer.hiring_momentum_score}</p><p className="text-[10px] uppercase text-muted-foreground">momentum</p></div>
              </div>
            ))}
            {!employers.data?.length && <Empty text="No employers yet. Add the first company you know recruits regularly." />}
          </div>
        </section>

        <section className="rounded-2xl border bg-card">
          <div className="border-b p-4"><h2 className="font-semibold">Hiring signals</h2><p className="text-xs text-muted-foreground">Vacancy and recruitment triggers.</p></div>
          <div className="divide-y">
            {(signals.data ?? []).slice(0, 10).map((signal) => (
              <div key={signal.id} className="p-4"><p className="font-medium text-sm">{signal.title}</p><p className="mt-1 text-xs text-muted-foreground">{signal.signal_type} · {signal.vacancy_count} vacancies · ~{signal.estimated_hires} hires</p></div>
            ))}
            {!signals.data?.length && <Empty text="No signals yet. The next phase will ingest recruitment sources." />}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b p-4"><div><h2 className="font-semibold">Employee pipeline</h2><p className="text-xs text-muted-foreground">Banking acquisition prospects are isolated until linked to CRM.</p></div><Link to="/people" className="text-sm text-primary hover:underline">Open CRM</Link></div>
        <div className="divide-y">
          {(prospects.data ?? []).map((prospect) => (
            <div key={prospect.id} className="flex items-center justify-between gap-4 p-4">
              <div><p className="font-medium">{prospect.first_name} {prospect.last_name || ""}</p><p className="text-xs text-muted-foreground">{prospect.job_title || "Role not set"} · {prospect.stage.replaceAll("_", " ")}</p></div>
              {prospect.crm_contact_id ? <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">CRM linked</span> : <button type="button" onClick={() => linkToCrm(prospect)} disabled={linkingId === prospect.id} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-accent">{linkingId === prospect.id ? "Linking…" : "Add to CRM"}</button>}
            </div>
          ))}
          {!prospects.data?.length && <Empty text="No employee prospects yet." />}
        </div>
      </section>

      <p className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
        Credit and other product opportunities are tracked as signals only. KYC, affordability, credit scoring, consent and final lending decisions remain with the bank's approved systems and policies.
      </p>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return <div className="rounded-2xl border bg-card p-4"><div className="flex items-center justify-between text-muted-foreground"><span className="text-xs uppercase tracking-wide">{label}</span><Icon className="h-4 w-4" /></div><p className="mt-2 text-2xl font-semibold">{value}</p></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="p-6 text-center text-sm text-muted-foreground">{text}</div>;
}
