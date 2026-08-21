import { createServerFn } from "@tanstack/react-start";
import { loadPublicFunnelImpl, validateFunnelSlug } from "./funnel.server";

export const loadPublicFunnel = createServerFn({ method: "GET" })
  .validator((data: unknown) => validateFunnelSlug(data))
  .handler(async ({ data }) => loadPublicFunnelImpl(data.slug));
