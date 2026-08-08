import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    // Without configured Supabase credentials, sessions can never exist.
    // Avoid calling the Supabase client (which would reject) and just send the
    // visitor to the auth landing page, which renders a friendly message.
    if (!(await import("@/integrations/supabase/client")).isSupabaseConfigured()) {
      throw redirect({ to: "/auth" });
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      throw redirect({ to: "/dashboard" });
    }
    throw redirect({ to: "/auth" });
  },
  component: IndexFallback,
});

function IndexFallback() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/auth" });
  }, [navigate]);
  return null;
}
