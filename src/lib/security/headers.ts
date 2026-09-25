/**
 * Baseline security headers applied to HTTP responses.
 *
 * NOTE ON CSP AND HSTS:
 * - Content-Security-Policy (CSP) is intentionally omitted from global
 *   application-level injection. AlexOS relies on Vite SSR, dynamic script
 *   chunks, inline theme bootstrap, and Supabase WebSocket/HTTP endpoints.
 *   A global static CSP without request-scoped nonces can break Vite
 *   development, React hydration, and module loading.
 * - Strict-Transport-Security (HSTS) is intentionally omitted from
 *   unconditional local application responses to prevent poisoning HTTP
 *   development environments such as localhost.
 * - Production HTTPS transport security is handled at the Cloudflare / edge
 *   boundary, or can be supplied by callers on secure responses.
 *
 * Caller-provided CSP and HSTS headers are always preserved.
 */

export const BASELINE_SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "SAMEORIGIN",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
} as const;

const NULL_BODY_STATUS_CODES = new Set([101, 204, 205, 304]);

export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  for (const [name, value] of Object.entries(BASELINE_SECURITY_HEADERS)) {
    if (!headers.has(name)) {
      headers.set(name, value);
    }
  }

  const body = NULL_BODY_STATUS_CODES.has(response.status) ? null : response.body;

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
