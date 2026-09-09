import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, Lock, Database, Globe, Check } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/settings")({ component: Settings });

const NOTIFICATION_PREFS_KEY = "alexos-settings-notification-prefs-v1";

type NotificationPrefs = {
  paymentReminders: boolean;
  goalMilestones: boolean;
  transactionAlerts: boolean;
  weeklySummary: boolean;
  debtDueDates: boolean;
};

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  paymentReminders: true,
  goalMilestones: true,
  transactionAlerts: true,
  weeklySummary: true,
  debtDueDates: true,
};

function readNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_PREFS;
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFS;
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return {
      paymentReminders: parsed.paymentReminders ?? DEFAULT_NOTIFICATION_PREFS.paymentReminders,
      goalMilestones: parsed.goalMilestones ?? DEFAULT_NOTIFICATION_PREFS.goalMilestones,
      transactionAlerts: parsed.transactionAlerts ?? DEFAULT_NOTIFICATION_PREFS.transactionAlerts,
      weeklySummary: parsed.weeklySummary ?? DEFAULT_NOTIFICATION_PREFS.weeklySummary,
      debtDueDates: parsed.debtDueDates ?? DEFAULT_NOTIFICATION_PREFS.debtDueDates,
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

function writeNotificationPrefs(prefs: NotificationPrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
}

function Settings() {
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(
    DEFAULT_NOTIFICATION_PREFS,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setNotificationPrefs(readNotificationPrefs());
    setHydrated(true);
  }, []);

  const updatePref = <K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) => {
    setNotificationPrefs((prev) => {
      const next = { ...prev, [key]: value };
      writeNotificationPrefs(next);
      return next;
    });
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
          <p className="text-sm text-muted-foreground">
            Notification preferences are saved on this device. Other controls remain read-only until
            workspace persistence is connected.
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
            checked={notificationPrefs.paymentReminders}
            onChange={(value) => updatePref("paymentReminders", value)}
            enabled={hydrated}
          />
          <SettingsToggle
            title="Goal Milestones"
            description="Celebrate goal achievements"
            checked={notificationPrefs.goalMilestones}
            onChange={(value) => updatePref("goalMilestones", value)}
            enabled={hydrated}
          />
          <SettingsToggle
            title="Transaction Alerts"
            description="Notify on large transactions"
            checked={notificationPrefs.transactionAlerts}
            onChange={(value) => updatePref("transactionAlerts", value)}
            enabled={hydrated}
          />
          <SettingsToggle
            title="Weekly Summary"
            description="Get your weekly financial summary"
            checked={notificationPrefs.weeklySummary}
            onChange={(value) => updatePref("weeklySummary", value)}
            enabled={hydrated}
          />
          <SettingsToggle
            title="Debt Due Dates"
            description="Reminder for debt payment due dates"
            checked={notificationPrefs.debtDueDates}
            onChange={(value) => updatePref("debtDueDates", value)}
            enabled={hydrated}
          />
          <p className="text-xs text-muted-foreground">
            Preferences are stored on this device only. Push, email, and WhatsApp delivery are not
            connected yet.
          </p>
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
        <p className="text-xs text-muted-foreground">Notification prefs saved on this device</p>
      </div>
    </div>
  );
}

function SettingsToggle({
  title,
  description,
  checked,
  onChange,
  enabled,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted p-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={!enabled}
        aria-label={`${title} preference`}
        className="h-4 w-4 rounded accent-primary disabled:cursor-not-allowed"
      />
    </div>
  );
}
