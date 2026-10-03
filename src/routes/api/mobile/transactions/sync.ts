import { createFileRoute } from "@tanstack/react-router";
import { createMobileApi } from "@/server/mobile-money/mobile-api.server";
import { authenticateMobileRequest } from "@/server/mobile-money/mobile-supabase.server";

const api = createMobileApi({ authenticate: authenticateMobileRequest });

export const Route = createFileRoute("/api/mobile/transactions/sync")({
  server: {
    handlers: {
      POST: ({ request }) => api.sync(request),
    },
  },
});
