import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  DollarSign,
  Percent,
  Calendar,
  User,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { LeadFormDialog } from "@/components/crm/LeadFormDialog";
import { ActivitiesTab, AttachmentsTab, NotesTab, TasksTab } from "@/components/crm/CrmTabs";
import { useContact, useDeleteLead, useLead, useLeadStageHistory } from "@/lib/crm/api";
import { LEAD_STAGES } from "@/lib/crm/constants";
import { contactDisplayName, formatCurrency } from "@/lib/crm/utils";

export const Route = createFileRoute("/_authenticated/people/leads/$id")({
  component: LeadDetailPage,
  head: () => ({
    meta: [
      { title: "Lead · Alex OS" },
      {
        name: "description",
        content: "Lead timeline, activities, tasks, notes and stage history in one view.",
      },
    ],
  }),
});

function LeadDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: lead, isLoading } = useLead(id);
  const { data: contact } = useContact(lead?.contact_id ?? undefined);
  const { data: history = [] } = useLeadStageHistory(id);
  const del = useDeleteLead();

  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!lead) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Lead not found.</p>
        <Button asChild variant="link">
          <Link to="/people/leads">Back to pipeline</Link>
        </Button>
      </div>
    );
  }

  const stage = LEAD_STAGES.find((s) => s.value === lead.stage);
  const weighted = (Number(lead.value ?? 0) * lead.probability) / 100;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link to="/people/leads">
            <ArrowLeft className="mr-2 h-4 w-4" /> Pipeline
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6 flex flex-col md:flex-row md:items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{lead.title}</h1>
                <Badge variant="outline" className="gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", stage?.color)} /> {stage?.label}
                </Badge>
              </div>
              {contact ? (
                <Link
                  to="/people/contacts/$id"
                  params={{ id: contact.id }}
                  className="inline-flex items-center gap-1.5 mt-1 text-sm text-muted-foreground hover:text-primary"
                >
                  <User className="h-4 w-4" /> {contactDisplayName(contact)}
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">No contact linked</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Edit3 className="mr-2 h-4 w-4" /> Edit
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm("Delete this lead?")) {
                    del.mutate(lead.id, { onSuccess: () => navigate({ to: "/people/leads" }) });
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Deal value"
          value={formatCurrency(Number(lead.value ?? 0))}
        />
        <StatCard icon={Percent} label="Probability" value={`${lead.probability}%`} />
        <StatCard icon={DollarSign} label="Weighted" value={formatCurrency(weighted)} />
        <StatCard icon={Calendar} label="Expected close" value={lead.expected_close_date ?? "—"} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Stage progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={lead.probability} />
        </CardContent>
      </Card>

      <Tabs defaultValue="activities">
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="activities">Timeline</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
          <TabsTrigger value="history">Stage history</TabsTrigger>
        </TabsList>
        <TabsContent value="activities" className="mt-4">
          <ActivitiesTab scope={{ leadId: id }} />
        </TabsContent>
        <TabsContent value="tasks" className="mt-4">
          <TasksTab scope={{ leadId: id }} />
        </TabsContent>
        <TabsContent value="notes" className="mt-4">
          <NotesTab scope={{ leadId: id }} />
        </TabsContent>
        <TabsContent value="attachments" className="mt-4">
          <AttachmentsTab scope={{ leadId: id }} />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          {history.length === 0 ? (
            <div className="text-center py-10 border rounded-xl bg-muted/20">
              <History className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No stage changes recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((h) => {
                const from = h.from_stage
                  ? LEAD_STAGES.find((s) => s.value === h.from_stage)
                  : null;
                const to = LEAD_STAGES.find((s) => s.value === h.to_stage);
                return (
                  <div
                    key={h.id}
                    className="flex items-center justify-between rounded-xl border bg-card p-3"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      {from ? (
                        <>
                          <Badge variant="outline">{from.label}</Badge>
                          <span className="text-muted-foreground">→</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-xs">Created as</span>
                      )}
                      <Badge>{to?.label}</Badge>
                    </div>
                    <span
                      className="text-xs text-muted-foreground"
                      title={format(new Date(h.changed_at), "PPpp")}
                    >
                      {formatDistanceToNow(new Date(h.changed_at), { addSuffix: true })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <LeadFormDialog open={editOpen} onOpenChange={setEditOpen} lead={lead} />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Icon className="h-3.5 w-3.5" /> {label}
        </div>
        <p className="text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
