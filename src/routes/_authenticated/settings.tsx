import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, Palette, Lock, Database, Globe, Save, Check } from "lucide-react";
import { useState } from "react";
import { VisualThemePicker } from "@/components/theme/VisualThemePicker";

export const Route = createFileRoute("/_authenticated/settings")({ component: Settings });

function Settings() {
  const [saved, setSaved] = useState(false);
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
          <p className="text-sm text-muted-foreground">Customize your AlexOS experience</p>
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
            <Palette className="h-4 w-4" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Command-center style</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Select the AlexOS or DailyGear visual preset, custom accent and appearance mode.
                </p>
              </div>
              <VisualThemePicker />
            </div>
          </div>
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
            <Button variant="outline" size="sm">
              Enable
            </Button>
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
            <Button variant="outline" size="sm">
              Configure
            </Button>
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
          <Button variant="outline" className="w-full justify-start gap-2">
            📊 Export All Data
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2">
            🗑️ Clear Cache
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2">
            🔄 Sync Now
          </Button>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 flex gap-2">
        <Button asChild variant="outline">
          <Link to="/dashboard">Cancel</Link>
        </Button>
        <Button className="flex-1 gap-2" onClick={handleSave}>
          <Save className="h-4 w-4" />
          {saved ? "Settings Saved!" : "Save Settings"}
        </Button>
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
