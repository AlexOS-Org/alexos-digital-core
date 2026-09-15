import "@/styles/institution-brands.css";

import mpesaLogo from "@/assets/branding/accounts/mpesa.png";
import kcbLogo from "@/assets/branding/accounts/kcb.png";
import imBankLogo from "@/assets/branding/accounts/im-bank.jpg";
import sbmLogo from "@/assets/branding/accounts/sbm.png";
import binanceLogo from "@/assets/branding/accounts/binance.png";
import cashLogo from "@/assets/branding/accounts/cash.png";
import {
  absaLogo,
  equityLogo,
  familyLogo,
  ncbaLogo,
} from "@/assets/branding/accounts/bank-logo-assets";

export const LOW_BALANCE_THRESHOLDS = {
  mobileMoney: 500,
  bank: 1000,
  salary: 5000,
  crypto: 1000,
  cash: 500,
} as const;

export type InstitutionKey =
  | "mpesa"
  | "kcb"
  | "im"
  | "sbm"
  | "equity"
  | "coop"
  | "ncba"
  | "absa"
  | "stanbic"
  | "family"
  | "airtel"
  | "salary"
  | "binance"
  | "cash"
  | "default";

export type InstitutionStyle = {
  key: InstitutionKey;
  initials: string;
  brandLabel: string;
  iconClass: string;
  panelClass: string;
  cardClass: string;
  actionClass: string;
  accentClass: string;
  softAccent: string;
  brandHex: string;
  warningThreshold: number | null;
};

const DEFAULT_STYLE: InstitutionStyle = {
  key: "default",
  initials: "AC",
  brandLabel: "Account",
  iconClass: "bg-primary/10 text-primary",
  panelClass: "bg-muted/40",
  cardClass:
    "border-slate-300/80 bg-gradient-to-br from-slate-200/80 via-slate-100/60 to-background dark:border-slate-700/70 dark:from-slate-900/60 dark:via-slate-900/30 dark:to-background",
  actionClass:
    "border-slate-300/70 bg-white/70 hover:bg-slate-50 dark:border-slate-700/70 dark:bg-background/50",
  accentClass: "bg-primary",
  softAccent: "oklch(0.74 0.12 220)",
  brandHex: "#64748b",
  warningThreshold: null,
};

function brandMarkDataUri(initials: string, hex: string): string {
  const safe = initials.slice(0, 3).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img"><rect width="64" height="64" rx="14" fill="${hex}"/><text x="32" y="38" text-anchor="middle" font-family="system-ui,Segoe UI,sans-serif" font-size="20" font-weight="700" fill="#ffffff">${safe}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function matchInstitution(name: string): InstitutionStyle {
  const value = name.toLowerCase();

  if (/m[- ]?pesa/.test(value)) {
    return {
      key: "mpesa",
      initials: "MP",
      brandLabel: "M-Pesa",
      iconClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      panelClass: "bg-emerald-50/70 dark:bg-emerald-950/20",
      cardClass:
        "border-emerald-300/80 bg-gradient-to-br from-emerald-200/90 via-emerald-100/70 to-emerald-50/60 dark:border-emerald-800/60 dark:from-emerald-950/60 dark:via-emerald-950/35 dark:to-background",
      actionClass:
        "border-emerald-300/70 bg-white/70 hover:bg-emerald-50 dark:border-emerald-800/70 dark:bg-background/50",
      accentClass: "bg-emerald-500",
      softAccent: "oklch(0.78 0.18 155)",
      brandHex: "#00A651",
      warningThreshold: LOW_BALANCE_THRESHOLDS.mobileMoney,
    };
  }
  if (/kcb|kenya commercial/.test(value)) {
    return {
      key: "kcb",
      initials: "KC",
      brandLabel: "KCB",
      iconClass: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
      panelClass: "bg-blue-50/70 dark:bg-blue-950/20",
      cardClass:
        "border-blue-300/80 bg-gradient-to-br from-blue-200/90 via-blue-100/70 to-blue-50/60 dark:border-blue-800/60 dark:from-blue-950/60 dark:via-blue-950/35 dark:to-background",
      actionClass:
        "border-blue-300/70 bg-white/70 hover:bg-blue-50 dark:border-blue-800/70 dark:bg-background/50",
      accentClass: "bg-blue-600",
      softAccent: "oklch(0.72 0.19 255)",
      brandHex: "#0033A0",
      warningThreshold: LOW_BALANCE_THRESHOLDS.bank,
    };
  }
  if (/i&m|im bank|i and m/.test(value)) {
    return {
      key: "im",
      initials: "IM",
      brandLabel: "I&M",
      iconClass: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
      panelClass: "bg-orange-50/70 dark:bg-orange-950/20",
      cardClass:
        "border-orange-300/80 bg-gradient-to-br from-orange-200/90 via-orange-100/70 to-orange-50/60 dark:border-orange-800/60 dark:from-orange-950/60 dark:via-orange-950/35 dark:to-background",
      actionClass:
        "border-orange-300/70 bg-white/70 hover:bg-orange-50 dark:border-orange-800/70 dark:bg-background/50",
      accentClass: "bg-orange-500",
      softAccent: "oklch(0.78 0.16 55)",
      brandHex: "#E85D04",
      warningThreshold: LOW_BALANCE_THRESHOLDS.bank,
    };
  }
  if (/sbm/.test(value)) {
    return {
      key: "sbm",
      initials: "SB",
      brandLabel: "SBM",
      iconClass: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
      panelClass: "bg-red-50/70 dark:bg-red-950/20",
      cardClass:
        "border-red-300/80 bg-gradient-to-br from-red-200/90 via-red-100/70 to-red-50/60 dark:border-red-800/60 dark:from-red-950/60 dark:via-red-950/35 dark:to-background",
      actionClass:
        "border-red-300/70 bg-white/70 hover:bg-red-50 dark:border-red-800/70 dark:bg-background/50",
      accentClass: "bg-red-600",
      softAccent: "oklch(0.7 0.2 25)",
      brandHex: "#C8102E",
      warningThreshold: LOW_BALANCE_THRESHOLDS.bank,
    };
  }
  if (/equity/.test(value)) {
    return {
      key: "equity",
      initials: "EQ",
      brandLabel: "Equity",
      iconClass: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
      panelClass: "bg-red-50/70 dark:bg-red-950/20",
      cardClass:
        "border-red-300/80 bg-gradient-to-br from-red-200/90 via-red-100/70 to-red-50/60 dark:border-red-800/60 dark:from-red-950/60 dark:via-red-950/35 dark:to-background",
      actionClass:
        "border-red-300/70 bg-white/70 hover:bg-red-50 dark:border-red-800/70 dark:bg-background/50",
      accentClass: "bg-red-700",
      softAccent: "oklch(0.55 0.18 25)",
      brandHex: "#8B1A1A",
      warningThreshold: LOW_BALANCE_THRESHOLDS.bank,
    };
  }
  if (/co[- ]?operative|co-?op|coop bank/.test(value)) {
    return {
      key: "coop",
      initials: "CO",
      brandLabel: "Co-op",
      iconClass: "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300",
      panelClass: "bg-teal-50/70 dark:bg-teal-950/20",
      cardClass:
        "border-teal-300/80 bg-gradient-to-br from-teal-200/90 via-teal-100/70 to-teal-50/60 dark:border-teal-800/60 dark:from-teal-950/60 dark:via-teal-950/35 dark:to-background",
      actionClass:
        "border-teal-300/70 bg-white/70 hover:bg-teal-50 dark:border-teal-800/70 dark:bg-background/50",
      accentClass: "bg-teal-600",
      softAccent: "oklch(0.72 0.14 180)",
      brandHex: "#00857C",
      warningThreshold: LOW_BALANCE_THRESHOLDS.bank,
    };
  }
  if (/ncba/.test(value)) {
    return {
      key: "ncba",
      initials: "NC",
      brandLabel: "NCBA",
      iconClass: "bg-stone-100 text-stone-800 dark:bg-stone-950/40 dark:text-stone-300",
      panelClass: "bg-stone-50/70 dark:bg-stone-950/20",
      cardClass:
        "border-stone-300/80 bg-gradient-to-br from-stone-200/90 via-stone-100/70 to-stone-50/60 dark:border-stone-800/60 dark:from-stone-950/60 dark:via-stone-950/35 dark:to-background",
      actionClass:
        "border-stone-300/70 bg-white/70 hover:bg-stone-50 dark:border-stone-800/70 dark:bg-background/50",
      accentClass: "bg-stone-700",
      softAccent: "oklch(0.45 0.04 50)",
      brandHex: "#3D2B1F",
      warningThreshold: LOW_BALANCE_THRESHOLDS.bank,
    };
  }
  if (/absa/.test(value)) {
    return {
      key: "absa",
      initials: "AB",
      brandLabel: "Absa",
      iconClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
      panelClass: "bg-rose-50/70 dark:bg-rose-950/20",
      cardClass:
        "border-rose-300/80 bg-gradient-to-br from-rose-200/90 via-rose-100/70 to-rose-50/60 dark:border-rose-800/60 dark:from-rose-950/60 dark:via-rose-950/35 dark:to-background",
      actionClass:
        "border-rose-300/70 bg-white/70 hover:bg-rose-50 dark:border-rose-800/70 dark:bg-background/50",
      accentClass: "bg-rose-600",
      softAccent: "oklch(0.68 0.18 15)",
      brandHex: "#AF0C3E",
      warningThreshold: LOW_BALANCE_THRESHOLDS.bank,
    };
  }
  if (/stanbic/.test(value)) {
    return {
      key: "stanbic",
      initials: "ST",
      brandLabel: "Stanbic",
      iconClass: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300",
      panelClass: "bg-indigo-50/70 dark:bg-indigo-950/20",
      cardClass:
        "border-indigo-300/80 bg-gradient-to-br from-indigo-200/90 via-indigo-100/70 to-indigo-50/60 dark:border-indigo-800/60 dark:from-indigo-950/60 dark:via-indigo-950/35 dark:to-background",
      actionClass:
        "border-indigo-300/70 bg-white/70 hover:bg-indigo-50 dark:border-indigo-800/70 dark:bg-background/50",
      accentClass: "bg-indigo-600",
      softAccent: "oklch(0.68 0.16 275)",
      brandHex: "#0033A1",
      warningThreshold: LOW_BALANCE_THRESHOLDS.bank,
    };
  }
  if (/family/.test(value)) {
    return {
      key: "family",
      initials: "FB",
      brandLabel: "Family Bank",
      iconClass: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300",
      panelClass: "bg-cyan-50/70 dark:bg-cyan-950/20",
      cardClass:
        "border-cyan-300/80 bg-gradient-to-br from-cyan-200/90 via-cyan-100/70 to-cyan-50/60 dark:border-cyan-800/60 dark:from-cyan-950/60 dark:via-cyan-950/35 dark:to-background",
      actionClass:
        "border-cyan-300/70 bg-white/70 hover:bg-cyan-50 dark:border-cyan-800/70 dark:bg-background/50",
      accentClass: "bg-cyan-600",
      softAccent: "oklch(0.74 0.12 210)",
      brandHex: "#0088CE",
      warningThreshold: LOW_BALANCE_THRESHOLDS.bank,
    };
  }
  if (/airtel/.test(value)) {
    return {
      key: "airtel",
      initials: "AT",
      brandLabel: "Airtel",
      iconClass: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
      panelClass: "bg-red-50/70 dark:bg-red-950/20",
      cardClass:
        "border-red-300/80 bg-gradient-to-br from-red-200/90 via-red-100/70 to-red-50/60 dark:border-red-800/60 dark:from-red-950/60 dark:via-red-950/35 dark:to-background",
      actionClass:
        "border-red-300/70 bg-white/70 hover:bg-red-50 dark:border-red-800/70 dark:bg-background/50",
      accentClass: "bg-red-600",
      softAccent: "oklch(0.7 0.2 25)",
      brandHex: "#ED1C24",
      warningThreshold: LOW_BALANCE_THRESHOLDS.mobileMoney,
    };
  }
  if (/salary/.test(value)) {
    return {
      key: "salary",
      initials: "SL",
      brandLabel: "Salary",
      iconClass: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
      panelClass: "bg-violet-50/70 dark:bg-violet-950/20",
      cardClass:
        "border-violet-300/80 bg-gradient-to-br from-violet-200/90 via-violet-100/70 to-violet-50/60 dark:border-violet-800/60 dark:from-violet-950/60 dark:via-violet-950/35 dark:to-background",
      actionClass:
        "border-violet-300/70 bg-white/70 hover:bg-violet-50 dark:border-violet-800/70 dark:bg-background/50",
      accentClass: "bg-violet-600",
      softAccent: "oklch(0.72 0.2 300)",
      brandHex: "#7C3AED",
      warningThreshold: LOW_BALANCE_THRESHOLDS.salary,
    };
  }
  if (/binance|crypto/.test(value)) {
    return {
      key: "binance",
      initials: "BN",
      brandLabel: "Binance",
      iconClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
      panelClass: "bg-amber-50/70 dark:bg-amber-950/20",
      cardClass:
        "border-amber-300/80 bg-gradient-to-br from-amber-200/90 via-amber-100/70 to-amber-50/60 dark:border-amber-800/60 dark:from-amber-950/60 dark:via-amber-950/35 dark:to-background",
      actionClass:
        "border-amber-300/70 bg-white/70 hover:bg-amber-50 dark:border-amber-800/70 dark:bg-background/50",
      accentClass: "bg-amber-500",
      softAccent: "oklch(0.82 0.17 85)",
      brandHex: "#F0B90B",
      warningThreshold: LOW_BALANCE_THRESHOLDS.crypto,
    };
  }
  if (/\bcash\b/.test(value)) {
    return {
      key: "cash",
      initials: "CA",
      brandLabel: "Cash",
      iconClass: "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
      panelClass: "bg-slate-50/70 dark:bg-slate-950/20",
      cardClass:
        "border-slate-300/80 bg-gradient-to-br from-slate-200/80 via-slate-100/60 to-background dark:border-slate-700/70 dark:from-slate-900/60 dark:via-slate-900/30 dark:to-background",
      actionClass:
        "border-slate-300/70 bg-white/70 hover:bg-slate-50 dark:border-slate-700/70 dark:bg-background/50",
      accentClass: "bg-slate-500",
      softAccent: "oklch(0.74 0.12 220)",
      brandHex: "#64748B",
      warningThreshold: LOW_BALANCE_THRESHOLDS.cash,
    };
  }

  return DEFAULT_STYLE;
}

export function getInstitutionStyle(name: string): InstitutionStyle {
  return matchInstitution(name);
}

export function getInstitutionKey(name: string): InstitutionKey {
  return matchInstitution(name).key;
}

export function getAccountLogo(name: string): string | null {
  const style = matchInstitution(name);
  const value = name.toLowerCase();

  if (/m[- ]?pesa/.test(value)) return mpesaLogo;
  if (/kcb|kenya commercial/.test(value)) return kcbLogo;
  if (/i&m|im bank|i and m/.test(value)) return imBankLogo;
  if (/sbm/.test(value)) return sbmLogo;
  if (/binance|crypto/.test(value)) return binanceLogo;
  if (/\bcash\b/.test(value) || /salary/.test(value)) return cashLogo;
  if (/absa/.test(value)) return absaLogo;
  if (/equity/.test(value)) return equityLogo;
  if (/family/.test(value)) return familyLogo;
  if (/ncba/.test(value)) return ncbaLogo;

  if (style.key !== "default") {
    return brandMarkDataUri(style.initials, style.brandHex);
  }
  return null;
}

export function getInstitutionInitials(name: string): string {
  return matchInstitution(name).initials;
}
