import { isSupabaseConfigured, getMissingSupabaseEnvVars } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";

/**
 * Small banner rendered at the top of authenticated pages when the Supabase
 * environment variables are missing in the deployment. It explains what is
 * wrong and what an administrator needs to do, instead of silently failing
 * or crashing the whole application.
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
        <p className="font-medium">
          The database connection is not configured for this deployment.
        </p>
        <p className="text-xs opacity-90">
          Missing configuration: {missing.join(", ")}. To fix this, the project administrator must
          add the Supabase secrets (see{" "}
          <code className="rounded bg-amber-100 px-1 text-xs dark:bg-amber-900/50">
            .env.example
          </code>{" "}
          in the repository) to the Lovable Cloud project settings under Secrets, then re-publish
          the site.
        </p>
      </div>
    </div>
  );
}
