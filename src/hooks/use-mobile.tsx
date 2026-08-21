import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const PHONE_LAYOUT_MAX_WIDTH = 1100;

/**
 * A real phone can report a wide CSS viewport when the browser's desktop-site
 * mode is enabled. Treat that case as mobile when the user agent or pointer
 * capability confirms a handheld device, while leaving touch laptops alone.
 */
export function getMobileLayoutMatch(): boolean {
  if (typeof window === "undefined") return false;

  const narrowViewport = window.innerWidth < MOBILE_BREAKPOINT;
  if (narrowViewport) return true;

  const userAgent = window.navigator.userAgent ?? "";
  const handheldUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent,
  );
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  return window.innerWidth < PHONE_LAYOUT_MAX_WIDTH && (handheldUserAgent || coarsePointer);
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => getMobileLayoutMatch());

  React.useEffect(() => {
    const update = () => setIsMobile(getMobileLayoutMatch());
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const pointer = window.matchMedia("(pointer: coarse)");
    mql.addEventListener("change", update);
    pointer.addEventListener("change", update);
    window.addEventListener("resize", update);
    update();
    return () => {
      mql.removeEventListener("change", update);
      pointer.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return isMobile;
}
