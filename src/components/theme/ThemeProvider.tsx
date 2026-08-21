import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_CUSTOM_ACCENT,
  DEFAULT_VISUAL_THEME,
  isVisualThemeId,
  type VisualThemeId,
} from "./visual-themes";
type Theme = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";
type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  visualTheme: VisualThemeId;
  customAccent: string;
  setVisualTheme: (theme: VisualThemeId) => void;
  setCustomAccent: (accent: string) => void;
};
const STORAGE_KEY = "alexos-theme";
const VISUAL_THEME_KEY = "alexos-visual-theme";
const CUSTOM_ACCENT_KEY = "alexos-custom-accent";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "dark";
}
function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function getStoredVisualTheme(): VisualThemeId {
  if (typeof window === "undefined") return DEFAULT_VISUAL_THEME;
  const stored = window.localStorage.getItem(VISUAL_THEME_KEY);
  return isVisualThemeId(stored) ? stored : DEFAULT_VISUAL_THEME;
}
function getStoredCustomAccent() {
  if (typeof window === "undefined") return DEFAULT_CUSTOM_ACCENT;
  return window.localStorage.getItem(CUSTOM_ACCENT_KEY) ?? DEFAULT_CUSTOM_ACCENT;
}
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);
  const [visualTheme, setVisualThemeState] = useState<VisualThemeId>(getStoredVisualTheme);
  const [customAccent, setCustomAccentState] = useState(getStoredCustomAccent);
  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemTheme(media.matches ? "dark" : "light");
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    document.documentElement.style.colorScheme = resolvedTheme;
    document.documentElement.dataset.visualTheme = visualTheme;
    document.documentElement.style.setProperty("--alexos-custom-accent", customAccent);
  }, [customAccent, resolvedTheme, visualTheme]);
  const setTheme = (next: Theme) => {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };
  const setVisualTheme = (next: VisualThemeId) => {
    setVisualThemeState(next);
    window.localStorage.setItem(VISUAL_THEME_KEY, next);
  };
  const setCustomAccent = (next: string) => {
    setCustomAccentState(next);
    window.localStorage.setItem(CUSTOM_ACCENT_KEY, next);
  };
  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      visualTheme,
      customAccent,
      setVisualTheme,
      setCustomAccent,
    }),
    [theme, resolvedTheme, visualTheme, customAccent],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
