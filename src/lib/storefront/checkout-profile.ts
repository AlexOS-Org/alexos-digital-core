const STORAGE_KEY = "dailygear.checkout-profile.v1";
const MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

export interface CheckoutProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  county: string;
  town: string;
  deliveryDetails: string;
  savedAt: string;
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function readCheckoutProfile(): CheckoutProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CheckoutProfile>;
    const savedAt = clean(parsed.savedAt, 40);
    if (!savedAt || Date.now() - new Date(savedAt).getTime() > MAX_AGE_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return {
      firstName: clean(parsed.firstName, 80),
      lastName: clean(parsed.lastName, 80),
      email: clean(parsed.email, 320),
      phone: clean(parsed.phone, 40),
      address: clean(parsed.address, 240),
      county: clean(parsed.county, 120),
      town: clean(parsed.town, 120),
      deliveryDetails: clean(parsed.deliveryDetails, 500),
      savedAt,
    };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveCheckoutProfile(profile: Omit<CheckoutProfile, "savedAt">) {
  if (typeof window === "undefined") return;
  const savedAt = new Date().toISOString();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...profile, savedAt }));
}

export function clearCheckoutProfile() {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
}
