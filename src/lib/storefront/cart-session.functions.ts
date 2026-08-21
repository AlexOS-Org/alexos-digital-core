import { createServerFn } from "@tanstack/react-start";
import {
  loadCartSessionImpl,
  saveCartSessionImpl,
  validateSaveCartSession,
} from "./cart-session.server";

export const saveCartSession = createServerFn({ method: "POST" })
  .validator((data: unknown) => validateSaveCartSession(data))
  .handler(async ({ data }) => saveCartSessionImpl(data));

export const loadCartSession = createServerFn({ method: "POST" })
  .validator((data: { sessionToken: string }) => data)
  .handler(async ({ data }) => loadCartSessionImpl(data.sessionToken));
