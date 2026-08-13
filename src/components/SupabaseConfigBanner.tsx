import { isSupabaseConfigured, getMissingSupabaseEnvVars } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";

/**
 * Small banner rendered at the top of authenticated pages when the Supabase
 * environment variables are missing in the current deployment.
 */
export function SupabaseConfigBanner() {
  if (isSupabaseConfigured()) return null;

  const missing = getMissingSupabaseEnvVars();

  return (
    <div
      role="alert"
      className="flex items-start gap-2 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <p className="font-medium">The database connection is not configured for this deployment.</p>
        <p className="text-xs opacity-90">
          Missing configuration: {missing.join(", ")}. Configure these Supabase environment
          variables in the hosting environment, then redeploy the application.
        </p>
      </div>
    </div>
  );
}
