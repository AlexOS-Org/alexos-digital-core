import { createFileRoute } from "@tanstack/react-router";
import { Users, UserPlus, Briefcase, Phone } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/people")({
  component: PeoplePage,
});

function PeoplePage() {
  const stats = [
    {
      title: "Customers",
      value: "0",
      icon: Users,
    },
    {
      title: "Leads",
      value: "0",
      icon: UserPlus,
    },
    {
      title: "Opportunities",
      value: "0",
      icon: Briefcase,
    },
    {
      title: "Follow Ups",
      value: "0",
      icon: Phone,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            CRM
          </h1>

          <p className="text-muted-foreground">
            Manage customers, leads and relationships.
          </p>
        </div>

        <Button>
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

        <CardContent className="py-20 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />

          <h2 className="text-xl font-semibold">
            No contacts yet
          </h2>

          <p className="text-muted-foreground mt-2">
            Your customers, leads and prospects will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}