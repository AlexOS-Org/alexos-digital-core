import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable,
} from "@dnd-kit/core";
import { Plus, KanbanSquare, Calendar, Percent, DollarSign, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useContacts, useLeads, useUpdateLeadStage } from "@/lib/crm/api";
import { LEAD_STAGES } from "@/lib/crm/constants";
import { contactDisplayName, formatCurrency } from "@/lib/crm/utils";
import { LeadFormDialog } from "@/components/crm/LeadFormDialog";
import type { Lead, LeadStage } from "@/lib/crm/types";

export const Route = createFileRoute("/_authenticated/people/leads")({
  component: LeadsPipelinePage,
  head: () => ({
    meta: [
      { title: "Revenue Pipeline · Alex OS" },
      { name: "description", content: "Track revenue opportunities from lead through follow-up, negotiation and sale with expected value and probability." },
    ],
  }),
});

function LeadsPipelinePage() {
  const { data: leads = [], isLoading } = useLeads();
  const { data: contacts = [] } = useContacts();
  const updateStage = useUpdateLeadStage();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultStage, setDefaultStage] = useState<LeadStage | undefined>();
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const contactMap = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);
  const byStage = useMemo(() => {
    const groups: Record<LeadStage, Lead[]> = {
      new: [], contacted: [], qualified: [], proposal: [], negotiation: [], won: [], lost: [],
    };
    leads.forEach((l) => groups[l.stage].push(l));
    return groups;
  }, [leads]);

  const totals = useMemo(() => {
    const t: Record<LeadStage, number> = {
      new: 0, contacted: 0, qualified: 0, proposal: 0, negotiation: 0, won: 0, lost: 0,
    };
    leads.forEach((l) => { t[l.stage] += Number(l.value ?? 0); });
    return t;
  }, [leads]);

  const pipelineSummary = useMemo(() => {
    const openStages: LeadStage[] = ["new", "contacted", "qualified", "proposal", "negotiation"];
    const openLeads = leads.filter((lead) => openStages.includes(lead.stage));
    const openValue = openLeads.reduce((sum, lead) => sum + Number(lead.value ?? 0), 0);
    const weightedValue = openLeads.reduce(
      (sum, lead) => sum + (Number(lead.value ?? 0) * Number(lead.probability ?? 0)) / 100,
      0,
    );
    return {
      openCount: openLeads.length,
      openValue,
      weightedValue,
      wonValue: totals.won,
    };
  }, [leads, totals.won]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragStart = (e: DragStartEvent) => {
    const lead = leads.find((l) => l.id === e.active.id);
    setActiveLead(lead ?? null);
  };
  const onDragEnd = (e: DragEndEvent) => {
    setActiveLead(null);
    const leadId = String(e.active.id);
    const overStage = e.over?.id as LeadStage | undefined;
    if (!overStage) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === overStage) return;
    updateStage.mutate({ id: leadId, stage: overStage });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Revenue Pipeline</h1>
          <p className="text-muted-foreground">Move opportunities from first contact to follow-up, negotiation and sale.</p>
        </div>
        <Button onClick={() => { setDefaultStage(undefined); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New Opportunity
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <PipelineStat icon={Target} label="Open opportunities" value={String(pipelineSummary.openCount)} />
          <PipelineStat icon={DollarSign} label="Open pipeline" value={formatCurrency(pipelineSummary.openValue)} />
          <PipelineStat icon={Percent} label="Weighted pipeline" value={formatCurrency(pipelineSummary.weightedValue)} />
          <PipelineStat icon={Trophy} label="Won revenue" value={formatCurrency(pipelineSummary.wonValue)} />
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {LEAD_STAGES.map((s) => <Skeleton key={s.value} className="h-64 w-full" />)}
        </div>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <KanbanSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold">No opportunities yet</h2>
            <p className="text-muted-foreground mt-1 mb-4">Track revenue opportunities from first touch to close.</p>
            <Button onClick={() => { setDefaultStage("new"); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Create your first opportunity
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {LEAD_STAGES.map((s) => (
              <StageColumn
                key={s.value}
                stage={s.value}
                label={s.label}
                color={s.color}
                total={totals[s.value]}
                leads={byStage[s.value]}
                contactMap={contactMap}
                onAdd={() => { setDefaultStage(s.value); setDialogOpen(true); }}
              />
            ))}
          </div>
          <DragOverlay>
            {activeLead ? (
              <LeadCard lead={activeLead} contactName={contactMap.get(activeLead.contact_id ?? "")?.first_name} dragging />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <LeadFormDialog open={dialogOpen} onOpenChange={setDialogOpen} defaultStage={defaultStage} />
    </div>
  );
}

function PipelineStat({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Icon className="h-3.5 w-3.5" /> {label}
        </div>
        <p className="text-lg sm:text-xl font-semibold truncate">{value}</p>
      </CardContent>
    </Card>
  );
}

function StageColumn({
  stage, label, color, total, leads, contactMap, onAdd,
}: {
  stage: LeadStage;
  label: string;
  color: string;
  total: number;
  leads: Lead[];
  contactMap: Map<string, { first_name: string; last_name: string | null }>;
  onAdd: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-2xl border bg-muted/30 min-h-[500px] transition-colors",
        isOver && "bg-primary/5 border-primary/50",
      )}
    >
      <div className="p-3 border-b">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", color)} />
            <span className="font-semibold text-sm">{label}</span>
            <span className="text-xs text-muted-foreground">({leads.length})</span>
          </div>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onAdd}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{formatCurrency(total)}</p>
      </div>
      <div className="p-2 space-y-2 flex-1">
        {leads.map((lead) => {
          const c = lead.contact_id ? contactMap.get(lead.contact_id) : undefined;
          return <DraggableLead key={lead.id} lead={lead} contactName={c ? contactDisplayName(c) : undefined} />;
        })}
        {leads.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Drop opportunities here</p>
        ) : null}
      </div>
    </div>
  );
}

function DraggableLead({ lead, contactName }: { lead: Lead; contactName?: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(isDragging && "opacity-40")}
    >
      <LeadCard lead={lead} contactName={contactName} />
    </div>
  );
}

function LeadCard({
  lead, contactName, dragging,
}: {
  lead: Lead;
  contactName?: string;
  dragging?: boolean;
}) {
  return (
    <Link
      to="/people/leads/$id"
      params={{ id: lead.id }}
      onClick={(e) => { if (dragging) e.preventDefault(); }}
      className={cn(
        "block rounded-xl border bg-card p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing",
        dragging && "shadow-lg ring-1 ring-primary",
      )}
    >
      <div className="font-medium text-sm line-clamp-2">{lead.title}</div>
      {contactName ? <div className="text-xs text-muted-foreground mt-0.5">{contactName}</div> : null}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <DollarSign className="h-3 w-3" /> {formatCurrency(Number(lead.value ?? 0))}
        </span>
        <span className="inline-flex items-center gap-1">
          <Percent className="h-3 w-3" /> {lead.probability}%
        </span>
        {lead.expected_close_date ? (
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {lead.expected_close_date}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
