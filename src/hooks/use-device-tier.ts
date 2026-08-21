import * as React from "react";
import { getMobileLayoutMatch } from "./use-mobile";

/**
 * Device tiers drive *layout selection*, not just resizing.
 * Each tier gets a purpose-built composition in the DailyGear surfaces.
 */
export type DeviceTier = "mobile" | "tablet" | "laptop" | "desktop" | "ultrawide";

const QUERIES: Array<[DeviceTier, string]> = [
  ["mobile", "(max-width: 767.98px)"],
  ["tablet", "(min-width: 768px) and (max-width: 1279.98px)"],
  ["laptop", "(min-width: 1280px) and (max-width: 1919.98px)"],
  ["desktop", "(min-width: 1920px) and (max-width: 2559.98px)"],
  ["ultrawide", "(min-width: 2560px)"],
];

function read(): DeviceTier {
  if (typeof window === "undefined") return "laptop";
  if (getMobileLayoutMatch()) return "mobile";
  for (const [tier, query] of QUERIES) {
    if (window.matchMedia(query).matches) return tier;
  }
  return "laptop";
}

export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = React.useState<DeviceTier>(() => read());

  React.useEffect(() => {
    const update = () => setTier(read());
    const lists = QUERIES.map(([, query]) => window.matchMedia(query));
    lists.forEach((list) => list.addEventListener("change", update));
    window.addEventListener("resize", update);
    update();
    return () => {
      lists.forEach((list) => list.removeEventListener("change", update));
      window.removeEventListener("resize", update);
    };
  }, []);

  return tier;
}

export function useIsTouchLayout() {
  const tier = useDeviceTier();
  return tier === "mobile" || tier === "tablet";
}

/** True once the component has mounted in the browser — avoids SSR mismatch. */
export function useHydrated() {
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  return hydrated;
}
