import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_CUSTOM_ACCENT,
  DEFAULT_VISUAL_THEME,
  isVisualThemeId,
  type VisualThemeId,
} from "./visual-themes";
import {
  DEFAULT_DASHBOARD_SCENE,
  isDashboardSceneId,
  type DashboardSceneId,
} from "./visual-scenes";
type Theme = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";
type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  visualTheme: VisualThemeId;
  customAccent: string;
  customSurface: string;
  customSidebar: string;
  setVisualTheme: (theme: VisualThemeId) => void;
  setCustomAccent: (accent: string) => void;
  setCustomSurface: (surface: string) => void;
  setCustomSidebar: (sidebar: string) => void;
  dashboardScene: DashboardSceneId;
  setDashboardScene: (scene: DashboardSceneId) => void;
};
const STORAGE_KEY = "alexos-theme";
const VISUAL_THEME_KEY = "alexos-visual-theme";
const CUSTOM_ACCENT_KEY = "alexos-custom-accent";
const CUSTOM_SURFACE_KEY = "alexos-custom-surface";
const CUSTOM_SIDEBAR_KEY = "alexos-custom-sidebar";
const DASHBOARD_SCENE_KEY = "alexos-dashboard-scene";
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
function getStoredCustomSurface() {
  if (typeof window === "undefined") return "#202337";
  return window.localStorage.getItem(CUSTOM_SURFACE_KEY) ?? "#202337";
}
function getStoredCustomSidebar() {
  if (typeof window === "undefined") return "#11182f";
  return window.localStorage.getItem(CUSTOM_SIDEBAR_KEY) ?? "#11182f";
}
function getStoredDashboardScene(): DashboardSceneId {
  if (typeof window === "undefined") return DEFAULT_DASHBOARD_SCENE;
  const stored = window.localStorage.getItem(DASHBOARD_SCENE_KEY);
  return isDashboardSceneId(stored) ? stored : DEFAULT_DASHBOARD_SCENE;
}
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);
  const [visualTheme, setVisualThemeState] = useState<VisualThemeId>(getStoredVisualTheme);
  const [customAccent, setCustomAccentState] = useState(getStoredCustomAccent);
  const [customSurface, setCustomSurfaceState] = useState(getStoredCustomSurface);
  const [customSidebar, setCustomSidebarState] = useState(getStoredCustomSidebar);
  const [dashboardScene, setDashboardSceneState] =
    useState<DashboardSceneId>(getStoredDashboardScene);
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
    document.documentElement.style.setProperty("--alexos-custom-surface", customSurface);
    document.documentElement.style.setProperty("--alexos-custom-sidebar", customSidebar);
  }, [customAccent, customSidebar, customSurface, resolvedTheme, visualTheme]);
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
  const setCustomSurface = (next: string) => {
    setCustomSurfaceState(next);
    window.localStorage.setItem(CUSTOM_SURFACE_KEY, next);
  };
  const setCustomSidebar = (next: string) => {
    setCustomSidebarState(next);
    window.localStorage.setItem(CUSTOM_SIDEBAR_KEY, next);
  };
  const setDashboardScene = (next: DashboardSceneId) => {
    setDashboardSceneState(next);
    window.localStorage.setItem(DASHBOARD_SCENE_KEY, next);
  };
  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      visualTheme,
      customAccent,
      customSurface,
      customSidebar,
      setVisualTheme,
      setCustomAccent,
      setCustomSurface,
      setCustomSidebar,
      dashboardScene,
      setDashboardScene,
    }),
    [theme, resolvedTheme, visualTheme, customAccent, customSurface, customSidebar, dashboardScene],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
