import { useEffect } from "react";
import { ArrowRight, GitBranch } from "lucide-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/dailygear/PageHeader";

export const Route = createFileRoute("/_authenticated/e-commerce/landing-pages")({
  head: () => ({
    meta: [
      { title: "Landing Pages | DailyGear" },
      {
        name: "description",
        content: "Landing-page content is now managed inside the DailyGear Funnels workspace.",
      },
    ],
  }),
  component: LandingPagesRedirect,
});

function LandingPagesRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: "/e-commerce/funnels", replace: true });
  }, [navigate]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Landing pages now live in Funnels"
        description="Landing content, offers, checkout and thank-you steps are configured together so every campaign has one clear customer journey."
      />
      <Card className="rounded-3xl">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <GitBranch className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">Use Funnels for the full journey</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You are being redirected to the canonical Funnels workspace.
              </p>
            </div>
          </div>
          <Button
            className="rounded-xl"
            onClick={() => void navigate({ to: "/e-commerce/funnels" })}
          >
            Open Funnels
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
