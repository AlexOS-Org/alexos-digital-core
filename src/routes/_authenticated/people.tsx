import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Users,
  UserPlus,
  Briefcase,
  Phone,
  Mail,
  Building2,
  Loader2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { ContactForm } from "@/components/crm/ContactForm";
import { useContacts } from "@/lib/crm/api";

export const Route = createFileRoute("/_authenticated/people")({
  component: PeoplePage,
});

function PeoplePage() {
  const [addContactOpen, setAddContactOpen] = useState(false);
  const { data: contacts = [], isLoading, error } = useContacts();

  const stats = [
    {
      title: "Contacts",
      value: contacts.length,
      icon: Users,
    },
    {
      title: "Leads",
      value: 0,
      icon: UserPlus,
    },
    {
      title: "Opportunities",
      value: 0,
      icon: Briefcase,
    },
    {
      title: "Follow Ups",
      value: 0,
      icon: Phone,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">CRM</h1>

          <p className="text-muted-foreground">
            Manage customers, leads and relationships.
          </p>
        </div>

        <Button onClick={() => setAddContactOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">
                  {item.title}
                </CardTitle>

                <Icon className="h-5 w-5 text-primary" />
              </CardHeader>

              <CardContent>
                <p className="text-3xl font-bold">
                  {item.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading contacts...
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="font-semibold text-destructive">
                Could not load contacts.
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                {error.message}
              </p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />

              <h2 className="text-xl font-semibold">
                No contacts yet
              </h2>

              <p className="mt-2 text-muted-foreground">
                Add your first customer, lead or prospect.
              </p>

              <Button
                className="mt-6"
                onClick={() => setAddContactOpen(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Your First Contact
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {contact.display_name}
                    </p>

                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {contact.company_name && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {contact.company_name}
                        </span>
                      )}

                      {contact.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {contact.email}
                        </span>
                      )}

                      {contact.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {contact.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
                    {contact.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addContactOpen} onOpenChange={setAddContactOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>

            <DialogDescription>
              Create a customer, prospect or relationship in your CRM.
            </DialogDescription>
          </DialogHeader>

          <ContactForm
            onSuccess={() => setAddContactOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
