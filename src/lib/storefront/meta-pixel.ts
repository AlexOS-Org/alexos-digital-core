import { useEffect } from "react";

const SCRIPT_ID = "dailygear-meta-pixel-script";

type PixelParams = Record<string, unknown>;
type PixelFunction = ((command: string, event: string, params?: PixelParams) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: (...args: unknown[]) => void;
};

declare global {
  interface Window {
    fbq?: PixelFunction;
    _fbq?: PixelFunction;
  }
}

function cleanParams(params: PixelParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
  );
}

export function initMetaPixel(pixelId: string | null | undefined) {
  if (typeof window === "undefined" || !pixelId?.trim()) return false;
  const normalizedId = pixelId.trim();
  if (window.fbq && document.getElementById(SCRIPT_ID)) return true;

  const fbq = ((...args: unknown[]) => {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue?.push(args);
  }) as PixelFunction;
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.push = (...args: unknown[]) => fbq.queue?.push(args);
  window.fbq = fbq;
  window._fbq = fbq;
  fbq("init", normalizedId);
  fbq("track", "PageView");

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  return true;
}

export function trackMetaPixel(event: string, params: PixelParams = {}) {
  if (typeof window === "undefined" || !window.fbq) return false;
  window.fbq("track", event, cleanParams(params));
  return true;
}

export function useMetaPixel(pixelId: string | null | undefined) {
  useEffect(() => {
    initMetaPixel(pixelId);
  }, [pixelId]);
}
