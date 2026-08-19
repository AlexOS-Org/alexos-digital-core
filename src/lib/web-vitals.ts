import { onCLS, onFCP, onINP, onLCP, type Metric } from "web-vitals";
import { supabase } from "../integrations/supabase/client";

type WebVitalMetricName = "CLS" | "FCP" | "INP" | "LCP";

type WebVitalsInsert = {
  user_id: string;
  route: string;
  metric_name: WebVitalMetricName;
  metric_value: number;
  metric_rating: "good" | "needs-improvement" | "poor" | "unknown";
  device_class: "mobile" | "desktop";
  connection_type: string;
  load_mode: "cold_or_initial";
  release_sha: string;
};

let sessionPromise: ReturnType<typeof supabase.auth.getSession> | null = null;

function getDeviceClass(): WebVitalsInsert["device_class"] {
  return window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
}

function getConnectionType(): string {
  const connection = (
    navigator as Navigator & {
      connection?: { effectiveType?: string };
    }
  ).connection;
  return connection?.effectiveType ?? "unknown";
}

function getReleaseSha(): string {
  return import.meta.env.VITE_RELEASE_SHA ?? "unknown";
}

async function getUserId(): Promise<string | null> {
  sessionPromise ??= supabase.auth.getSession();
  const { data, error } = await sessionPromise;
  if (error) return null;
  return data.session?.user.id ?? null;
}

function sendMetric(metric: Metric, userId: string): void {
  const metricName = metric.name as WebVitalMetricName;
  if (!["CLS", "FCP", "INP", "LCP"].includes(metricName)) return;

  const payload: WebVitalsInsert = {
    user_id: userId,
    route: window.location.pathname,
    metric_name: metricName,
    metric_value: metric.value,
    metric_rating: (metric.rating ?? "unknown") as WebVitalsInsert["metric_rating"],
    device_class: getDeviceClass(),
    connection_type: getConnectionType(),
    load_mode: "cold_or_initial",
    release_sha: getReleaseSha(),
  };

  void supabase
    .from("web_vitals_events")
    .insert(payload)
    .then(({ error }) => {
      if (error && import.meta.env.DEV) {
        console.debug("[AlexOS Web Vitals] Event was not stored", error.message);
      }
    });
}

/**
 * Starts non-blocking first-party Web Vitals collection for the current page.
 * Metrics are sent only for authenticated users and contain no business, order,
 * customer, Meta, URL-query, cookie, or token data.
 */
export function startWebVitalsMonitoring(sampleRate = 1): () => void {
  if (
    typeof window === "undefined" ||
    !window.location.pathname.startsWith("/e-commerce") ||
    Math.random() > sampleRate
  ) {
    return () => undefined;
  }

  let active = true;
  void getUserId().then((userId) => {
    if (!active || !userId) return;
    const report = (metric: Metric) => sendMetric(metric, userId);
    onCLS(report);
    onFCP(report);
    onINP(report);
    onLCP(report);
  });

  return () => {
    active = false;
  };
}
