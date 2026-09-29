import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useBusinesses } from "./api";
import type { Business, BusinessContextValue, BusinessType } from "./types";
import { resolveBusinessByHostname } from "./hostname";

const STORAGE_KEY = "alexos-business-context";

const BusinessContext = createContext<BusinessContextValue | null>(null);

function resolveInitialSlug(): string | null {
  const stored = readInitialBusinessSlug();
  if (stored) return stored;

  return readHostnameSlug();
}

function readHostnameSlug(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  if (!host) return null;
  return resolveBusinessByHostname(host);
}

function readInitialBusinessSlug(): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed.slug === "string" && parsed.slug ? parsed.slug : null;
  } catch {
    return null;
  }
}

function storeBusinessSlug(slug: string | null) {
  if (typeof window === "undefined") return;
  if (slug) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ slug }));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function BusinessContextProvider({ children }: { children: ReactNode }) {
  const { data: businesses = [] } = useBusinesses();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(resolveInitialSlug());

  const business = useMemo<Business | null>(
    () => businesses.find((b) => b.slug === selectedSlug) ?? null,
    [businesses, selectedSlug],
  );

  const setBusiness = useCallback((next: Business | null) => {
    const slug = next?.slug ?? null;
    setSelectedSlug(slug);
    storeBusinessSlug(slug);
  }, []);

  const clearBusiness = useCallback(() => {
    setSelectedSlug(null);
    storeBusinessSlug(null);
  }, []);

  useEffect(() => {
    if (selectedSlug && !business) {
      const stillExists = businesses.some((b) => b.slug === selectedSlug);
      if (!stillExists) {
        clearBusiness();
      }
    }
  }, [selectedSlug, business, businesses, clearBusiness]);

  const isActive = business !== null;
  const isPortfolio = business === null;
  const businessType: BusinessType = (business?.business_type as BusinessType) ?? null;

  const value = useMemo<BusinessContextValue>(
    () => ({
      business,
      isActive,
      isPortfolio,
      businessType,
      setBusiness,
      clearBusiness,
    }),
    [business, isActive, isPortfolio, businessType, setBusiness, clearBusiness],
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusinessContext(): BusinessContextValue {
  const ctx = useContext(BusinessContext);
  if (!ctx) {
    throw new Error("useBusinessContext must be used within a BusinessContextProvider");
  }
  return ctx;
}

export function useBusinessContextOptional(): BusinessContextValue | null {
  return useContext(BusinessContext);
}
