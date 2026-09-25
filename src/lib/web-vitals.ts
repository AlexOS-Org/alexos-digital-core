import { onCLS, onFCP, onINP, onLCP, type Metric } from "web-vitals";
import { supabase } from "../integrations/supabase/client";

export type WebVitalMetricName = "CLS" | "FCP" | "INP" | "LCP";

export type WebVitalsInsert = {
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

function getDeviceClass(): WebVitalsInsert["device_class"] {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "desktop";
  }

  return window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
}

function getConnectionType(): string {
  if (typeof navigator === "undefined") {
    return "unknown";
  }

  const connection = (
    navigator as Navigator & {
      connection?: { effectiveType?: string };
    }
  ).connection;

  return connection?.effectiveType ?? "unknown";
}

function getReleaseSha(): string {
  return (typeof import.meta !== "undefined" && import.meta.env?.VITE_RELEASE_SHA) || "unknown";
}

async function getUserId(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data?.session?.user?.id) {
      return null;
    }

    return data.session.user.id;
  } catch {
    return null;
  }
}

export function sendMetric(metric: Metric, userId: string): void {
  const metricName = metric?.name as WebVitalMetricName;

  if (!["CLS", "FCP", "INP", "LCP"].includes(metricName)) {
    return;
  }

  const rawPath =
    typeof window !== "undefined" && window.location?.pathname ? window.location.pathname : "";

  const route = rawPath.split("?")[0] || "/";

  const payload: WebVitalsInsert = {
    user_id: userId,
    route,
    metric_name: metricName,
    metric_value:
      typeof metric.value === "number" && Number.isFinite(metric.value) ? metric.value : 0,
    metric_rating:
      metric.rating === "good" || metric.rating === "needs-improvement" || metric.rating === "poor"
        ? metric.rating
        : "unknown",
    device_class: getDeviceClass(),
    connection_type: getConnectionType(),
    load_mode: "cold_or_initial",
    release_sha: getReleaseSha(),
  };

  void supabase
    .from("web_vitals_events")
    .insert(payload)
    .then(({ error }) => {
      if (error && typeof import.meta !== "undefined" && import.meta.env?.DEV) {
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
    !window.location?.pathname ||
    !window.location.pathname.startsWith("/e-commerce") ||
    (sampleRate < 1 && Math.random() > sampleRate)
  ) {
    return () => undefined;
  }

  let active = true;

  void getUserId().then((userId) => {
    if (!active || !userId) {
      return;
    }

    const report = (metric: Metric) => {
      if (!active) {
        return;
      }

      sendMetric(metric, userId);
    };

    onCLS(report);
    onFCP(report);
    onINP(report);
    onLCP(report);
  });

  return () => {
    active = false;
  };
}
