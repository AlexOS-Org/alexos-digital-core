import { Eye, EyeOff } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "alexos-balances-visible";
const HIDDEN_VALUE = "••••••";

type BalanceVisibilityContextValue = {
  balancesVisible: boolean;
  toggleBalances: () => void;
  maskBalance: (value: string) => string;
};

const BalanceVisibilityContext = createContext<BalanceVisibilityContextValue | null>(null);

function readInitialVisibility() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(STORAGE_KEY) !== "false";
}

export function BalanceVisibilityProvider({ children }: { children: ReactNode }) {
  const [balancesVisible, setBalancesVisible] = useState(readInitialVisibility);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(balancesVisible));
  }, [balancesVisible]);

  const value = useMemo<BalanceVisibilityContextValue>(
    () => ({
      balancesVisible,
      toggleBalances: () => setBalancesVisible((visible) => !visible),
      maskBalance: (value) => (balancesVisible ? value : HIDDEN_VALUE),
    }),
    [balancesVisible],
  );

  return (
    <BalanceVisibilityContext.Provider value={value}>{children}</BalanceVisibilityContext.Provider>
  );
}

export function useBalanceVisibility() {
  const context = useContext(BalanceVisibilityContext);
  if (!context)
    throw new Error("useBalanceVisibility must be used inside BalanceVisibilityProvider");
  return context;
}

export function BalanceVisibilityToggle({ compact = false }: { compact?: boolean }) {
  const { balancesVisible, toggleBalances } = useBalanceVisibility();
  const label = balancesVisible ? "Hide balances" : "Show balances";
  const Icon = balancesVisible ? Eye : EyeOff;

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? "icon" : "sm"}
      onClick={toggleBalances}
      aria-label={label}
      aria-pressed={!balancesVisible}
      title={label}
      className={compact ? "tap-target h-10 w-10 rounded-xl" : "gap-2 rounded-xl"}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {!compact && <span>{label}</span>}
    </Button>
  );
}

export { HIDDEN_VALUE };
