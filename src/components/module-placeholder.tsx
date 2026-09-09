import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { Clock, Sparkles, Rocket, Brain } from "lucide-react";

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function ModulePlaceholder({ title, description, icon: Icon }: Props) {
  return (
    <div className="alexos-module-shell mx-auto max-w-5xl space-y-8 rounded-[2rem] p-1 sm:p-2 animate-in fade-in duration-500">
      <div className="dashboard-feature-surface relative overflow-hidden rounded-[1.85rem] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex items-start gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
            <Icon className="h-8 w-8" />
          </div>

          <div>
            <p className="dashboard-eyebrow mb-1">Roadmap module</p>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      <Card className="dashboard-surface alexos-module-card rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            Intelligence Preview
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="leading-7 text-muted-foreground">
            This is a roadmap preview. No persistent records, live integrations or automated actions
            are connected to this module yet.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="alexos-data-metric alexos-module-card rounded-[1.35rem]">
              <CardContent className="relative z-[1] space-y-3 p-5">
                <Rocket className="h-6 w-6 text-primary" />
                <h3 className="font-semibold">Automation</h3>
                <p className="text-sm text-muted-foreground">
                  Automate repetitive business processes.
                </p>
              </CardContent>
            </Card>

            <Card className="alexos-data-metric alexos-module-card rounded-[1.35rem]">
              <CardContent className="relative z-[1] space-y-3 p-5">
                <Brain className="h-6 w-6 text-primary" />
                <h3 className="font-semibold">AI Intelligence</h3>
                <p className="text-sm text-muted-foreground">
                  Auren Intelligence will be connected here after the underlying data workflow is
                  implemented and verified.
                </p>
              </CardContent>
            </Card>

            <Card className="alexos-data-metric alexos-module-card rounded-[1.35rem]">
              <CardContent className="relative z-[1] space-y-3 p-5">
                <Clock className="h-6 w-6 text-primary" />
                <h3 className="font-semibold">Roadmap preview</h3>
                <p className="text-sm text-muted-foreground">
                  This module is scheduled in the AlexOS roadmap.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="inline-flex items-center rounded-xl border border-dashed border-border/60 px-4 py-2 text-sm text-muted-foreground">
            <Sparkles className="mr-2 h-4 w-4" />
            Persistence and integrations pending
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
