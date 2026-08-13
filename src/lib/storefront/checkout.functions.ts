import { createServerFn } from "@tanstack/react-start";
import {
  placeGuestOrderImpl,
  trackOrderImpl,
  validateGuestOrder,
  type GuestOrderInput,
} from "./checkout.server";

export const placeGuestOrder = createServerFn({ method: "POST" })
  .validator((data: unknown): GuestOrderInput => validateGuestOrder(data))
  .handler(async ({ data }) => placeGuestOrderImpl(data));

export const trackOrder = createServerFn({ method: "POST" })
  .validator((data: { orderNumber: string; contact: string }) => data)
  .handler(async ({ data }) => trackOrderImpl(data.orderNumber, data.contact));
