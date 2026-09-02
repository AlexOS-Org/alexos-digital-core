import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Mail, Phone, Building2, Edit3, Trash2, Plus, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactAvatar } from "@/components/crm/ContactAvatar";
import { ContactFormDialog } from "@/components/crm/ContactFormDialog";
import { LeadFormDialog } from "@/components/crm/LeadFormDialog";
import { ActivitiesTab, AttachmentsTab, NotesTab, TasksTab } from "@/components/crm/CrmTabs";
import { useContact, useDeleteContact, useLeads } from "@/lib/crm/api";
import { CONTACT_STATUSES, LEAD_STAGES } from "@/lib/crm/constants";
import { contactDisplayName, formatCurrency } from "@/lib/crm/utils";

export const Route = createFileRoute("/_authenticated/people/contacts/$id")({
  component: ContactDetailPage,
  head: () => ({
    meta: [
      { title: "Contact · AlexOS" },
      {
        name: "description",
        content: "Full contact profile with leads, activities, tasks, notes and attachments.",
      },
    ],
  }),
});

function ContactDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: contact, isLoading } = useContact(id);
  const { data: leads = [] } = useLeads({ contactId: id });
  const del = useDeleteContact();

  const [editOpen, setEditOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!contact) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Contact not found.</p>
        <Button asChild variant="link">
          <Link to="/people">Back to contacts</Link>
        </Button>
      </div>
    );
  }

  const statusLabel = CONTACT_STATUSES.find((s) => s.value === contact.status)?.label;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link to="/people">
            <ArrowLeft className="mr-2 h-4 w-4" /> Contacts
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6 flex flex-col md:flex-row md:items-center gap-4">
            <ContactAvatar contact={contact} className="h-16 w-16 text-lg" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{contactDisplayName(contact)}</h1>
                <Badge variant="outline">{statusLabel}</Badge>
              </div>
              {contact.job_title || contact.company ? (
                <p className="text-muted-foreground text-sm">
                  {contact.job_title}
                  {contact.job_title && contact.company ? " · " : ""}
                  {contact.company}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-4 mt-2 text-sm">
                {contact.email ? (
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex items-center gap-1.5 hover:text-primary"
                  >
                    <Mail className="h-4 w-4" /> {contact.email}
                  </a>
                ) : null}
                {contact.phone ? (
                  <a
                    href={`tel:${contact.phone}`}
                    className="inline-flex items-center gap-1.5 hover:text-primary"
                  >
                    <Phone className="h-4 w-4" /> {contact.phone}
                  </a>
                ) : null}
                {contact.company ? (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="h-4 w-4" /> {contact.company}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Edit3 className="mr-2 h-4 w-4" /> Edit
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm(`Delete ${contactDisplayName(contact)}?`)) {
                    del.mutate(contact.id, { onSuccess: () => navigate({ to: "/people" }) });
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
              <span className="text-muted-foreground">Source</span>
              <span>{contact.source ?? "—"}</span>
              <span className="text-muted-foreground">Status</span>
              <span>{statusLabel}</span>
              <span className="text-muted-foreground">Company</span>
              <span>{contact.company ?? "—"}</span>
              <span className="text-muted-foreground">Job title</span>
              <span>{contact.job_title ?? "—"}</span>
              <span className="text-muted-foreground">Created</span>
              <span>{new Date(contact.created_at).toLocaleDateString()}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                {contact.notes || "No notes on this contact."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setLeadOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Lead
            </Button>
          </div>
          {leads.length === 0 ? (
            <div className="text-center py-10 border rounded-xl bg-muted/20">
              <Briefcase className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No leads for this contact.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {leads.map((l) => {
                const stage = LEAD_STAGES.find((s) => s.value === l.stage);
                return (
                  <Link
                    key={l.id}
                    to="/people/leads/$id"
                    params={{ id: l.id }}
                    className="flex items-center justify-between rounded-xl border bg-card p-4 hover:bg-accent/40"
                  >
                    <div>
                      <p className="font-medium">{l.title}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                        <span>{stage?.label}</span>
                        <span>{formatCurrency(Number(l.value ?? 0))}</span>
                        <span>{l.probability}%</span>
                      </div>
                    </div>
                    <Badge variant="outline">{stage?.label}</Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activities" className="mt-4">
          <ActivitiesTab scope={{ contactId: id }} />
        </TabsContent>
        <TabsContent value="tasks" className="mt-4">
          <TasksTab scope={{ contactId: id }} />
        </TabsContent>
        <TabsContent value="notes" className="mt-4">
          <NotesTab scope={{ contactId: id }} />
        </TabsContent>
        <TabsContent value="attachments" className="mt-4">
          <AttachmentsTab scope={{ contactId: id }} />
        </TabsContent>
      </Tabs>

      <ContactFormDialog open={editOpen} onOpenChange={setEditOpen} contact={contact} />
      <LeadFormDialog open={leadOpen} onOpenChange={setLeadOpen} defaultContactId={id} />
    </div>
  );
}
