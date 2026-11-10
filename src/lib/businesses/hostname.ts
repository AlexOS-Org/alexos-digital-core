const HOSTNAME_TO_SLUG: Readonly<Record<string, string>> = {};

const PORTFOLIO_HOSTNAMES: Readonly<Set<string>> = new Set([
  "alexos.co.ke",
  "www.alexos.co.ke",
  "app.alexos.co.ke",
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
]);

export function resolveBusinessByHostname(hostname: string): string | null {
  if (!hostname) return null;
  const normalized = hostname.toLowerCase().trim();
  if (PORTFOLIO_HOSTNAMES.has(normalized)) return null;
  const direct = HOSTNAME_TO_SLUG[normalized];
  if (direct) return direct;
  const cleanHost = normalized.replace(/^www\./, "");
  return HOSTNAME_TO_SLUG[cleanHost] ?? null;
}

export function resolveHostnameFromRequest(request: Request): string | null {
  const host = request.headers.get("host");
  if (!host) return null;
  const hostname = host.split(":")[0];
  return resolveBusinessByHostname(hostname);
}
