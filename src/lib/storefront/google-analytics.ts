const SCRIPT_ID = "dailygear-google-analytics-script";
const DEFAULT_MEASUREMENT_ID = "";

type AnalyticsParams = Record<string, unknown>;
type Gtag = (command: string, action: string, params?: AnalyticsParams) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

function measurementId() {
  return (
    (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim() || DEFAULT_MEASUREMENT_ID
  );
}

export function initGoogleAnalytics() {
  if (typeof window === "undefined") return false;
  const id = measurementId();
  if (!id) return false;
  if (window.gtag && document.getElementById(SCRIPT_ID)) return true;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = (...args: Parameters<Gtag>) => {
    window.dataLayer?.push(args);
  };
  window.gtag("js", new Date().toISOString());
  window.gtag("config", id, { send_page_view: true });

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
  return true;
}

export function trackGoogleAnalytics(event: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined") return false;
  initGoogleAnalytics();
  if (!window.gtag) return false;
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  );
  window.gtag("event", event, cleanParams);
  return true;
}
