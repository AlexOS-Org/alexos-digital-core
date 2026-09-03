import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { Clock, Sparkles, Rocket, Brain } from "lucide-react";

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function ModulePlaceholder({ title, description, icon: Icon }: Props) {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start gap-5">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="h-8 w-8" />
        </div>

        <div>
          <h1 className="text-3xl font-bold">{title}</h1>

          <p className="text-muted-foreground mt-2 max-w-2xl">{description}</p>
        </div>
      </div>

      <Card className="rounded-3xl border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            Intelligence Preview
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-muted-foreground leading-7">
            This is a roadmap preview. No persistent records, live integrations or automated actions
            are connected to this module yet.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-5 space-y-3">
                <Rocket className="h-6 w-6 text-primary" />
                <h3 className="font-semibold">Automation</h3>
                <p className="text-sm text-muted-foreground">
                  Automate repetitive business processes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-3">
                <Brain className="h-6 w-6 text-primary" />
                <h3 className="font-semibold">AI Intelligence</h3>
                <p className="text-sm text-muted-foreground">
                  Auren Intelligence will be connected here after the underlying data workflow is
                  implemented and verified.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-3">
                <Clock className="h-6 w-6 text-primary" />
                <h3 className="font-semibold">Roadmap preview</h3>
                <p className="text-sm text-muted-foreground">
                  This module is scheduled in the AlexOS roadmap.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="inline-flex items-center rounded-xl border border-dashed px-4 py-2 text-sm text-muted-foreground">
            <Sparkles className="mr-2 h-4 w-4" />
            Persistence and integrations pending
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
