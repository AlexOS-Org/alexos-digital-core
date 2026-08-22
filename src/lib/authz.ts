import type { User } from "@supabase/supabase-js";

const DEFAULT_OWNER_EMAIL = "alexonkwani@gmail.com";

function configuredOwnerEmails() {
  const configured = import.meta.env.VITE_ALEXOS_OWNER_EMAILS ?? "";
  return new Set(
    (configured ? configured.split(",") : [DEFAULT_OWNER_EMAIL])
      .map((email: string) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * AlexOS is a private owner workspace. This is an authorization layer in
 * addition to Supabase authentication and database RLS. The email allowlist
 * is intentionally public configuration; it is not a secret or credential.
 */
export function isAuthorizedAlexOSUser(user: Pick<User, "email"> | null | undefined) {
  const email = user?.email?.trim().toLowerCase();
  return Boolean(email && configuredOwnerEmails().has(email));
}

export function unauthorizedWorkspaceMessage() {
  return "This AlexOS workspace is private. Your account is not authorized to access it.";
}
