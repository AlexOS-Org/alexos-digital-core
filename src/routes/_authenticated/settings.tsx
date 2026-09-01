import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, Lock, Database, Globe, Check } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/settings")({ component: Settings });

function Settings() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Customize your AlexOS experience · read-only preview
          </p>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Currency</label>
            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <span>Kenya Shilling (KES)</span>
              <span className="text-xl font-bold text-primary">KSh</span>
            </div>
            <p className="text-xs text-muted-foreground">
              All monetary values are displayed in Kenya Shillings
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Timezone</label>
            <div className="rounded-lg bg-muted p-3">
              <span>East Africa Time (EAT) UTC+3</span>
            </div>
            <p className="text-xs text-muted-foreground">Used for scheduling and reporting</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Format</label>
            <div className="rounded-lg bg-muted p-3">
              <span>DD/MM/YYYY (Kenya Standard)</span>
            </div>
            <p className="text-xs text-muted-foreground">Used throughout the application</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Language</label>
            <div className="rounded-lg bg-muted p-3">
              <span>English</span>
            </div>
            <p className="text-xs text-muted-foreground">Application language</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SettingsToggle
            title="Payment Reminders"
            description="Get notified about upcoming payments"
            defaultChecked
          />
          <SettingsToggle
            title="Goal Milestones"
            description="Celebrate goal achievements"
            defaultChecked
          />
          <SettingsToggle
            title="Transaction Alerts"
            description="Notify on large transactions"
            defaultChecked
          />
          <SettingsToggle
            title="Weekly Summary"
            description="Get your weekly financial summary"
            defaultChecked
          />
          <SettingsToggle
            title="Debt Due Dates"
            description="Reminder for debt payment due dates"
            defaultChecked
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <div>
              <p className="text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">Secure your account with 2FA</p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Unavailable until persistence is connected
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <div>
              <p className="text-sm font-medium">Data Encryption</p>
              <p className="text-xs text-muted-foreground">Bank-grade encryption enabled</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
              <Check className="h-4 w-4" /> Active
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <div>
              <p className="text-sm font-medium">Session Timeout</p>
              <p className="text-xs text-muted-foreground">Auto logout after 30 minutes</p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Unavailable until persistence is connected
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button disabled variant="outline" className="w-full justify-start gap-2">
            Export All Data · unavailable
          </Button>
          <Button disabled variant="outline" className="w-full justify-start gap-2">
            Clear Cache · unavailable
          </Button>
          <Button disabled variant="outline" className="w-full justify-start gap-2">
            Sync Now · unavailable
          </Button>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 flex items-center gap-3">
        <Button asChild variant="outline">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
        <p className="text-xs text-muted-foreground">Persistence not connected</p>
      </div>
    </div>
  );
}

function SettingsToggle({
  title,
  description,
  defaultChecked = false,
}: {
  title: string;
  description: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted p-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        className="h-4 w-4 cursor-pointer rounded accent-primary"
      />
    </div>
  );
}
