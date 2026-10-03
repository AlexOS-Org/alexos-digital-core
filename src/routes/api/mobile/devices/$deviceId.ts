import { createFileRoute } from "@tanstack/react-router";
import { createMobileApi } from "@/server/mobile-money/mobile-api.server";
import { authenticateMobileRequest } from "@/server/mobile-money/mobile-supabase.server";

const api = createMobileApi({ authenticate: authenticateMobileRequest });

export const Route = createFileRoute("/api/mobile/devices/$deviceId")({
  server: {
    handlers: {
      POST: ({ request, params }) => api.revoke(request, params.deviceId),
    },
  },
});
