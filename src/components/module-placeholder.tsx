import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { Clock, Sparkles, Rocket, Brain } from "lucide-react";

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function ModulePlaceholder({
  title,
  description,
  icon: Icon,
}: Props) {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start gap-5">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="h-8 w-8" />
        </div>

        <div>
          <h1 className="text-3xl font-bold">{title}</h1>

          <p className="text-muted-foreground mt-2 max-w-2xl">
            {description}
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            Orion AI Preview
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-muted-foreground leading-7">
            This module is currently under active development.
            When completed, Orion AI will help you make smarter
            business decisions, automate repetitive work and
            generate more revenue from this area of your business.
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
                  Receive intelligent recommendations from Orion.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-3">
                <Clock className="h-6 w-6 text-primary" />
                <h3 className="font-semibold">Coming Soon</h3>
                <p className="text-sm text-muted-foreground">
                  This module is scheduled in the AlexOS roadmap.
                </p>
              </CardContent>
            </Card>
          </div>

          <Button size="lg" className="rounded-xl">
            <Sparkles className="mr-2 h-4 w-4" />
            Build in Progress
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}