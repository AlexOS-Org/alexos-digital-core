export type VisualThemeId = "midnight" | "aurora" | "dailygear" | "paper" | "custom";
export type VisualBackdrop = "mountains" | "gradient" | "none";
export type VisualTheme = {
  id: VisualThemeId;
  label: string;
  description: string;
  backdrop: VisualBackdrop;
  accent: "blue" | "purple" | "red" | "green" | "custom";
};
export const VISUAL_THEMES: Record<VisualThemeId, VisualTheme> = {
  midnight: {
    id: "midnight",
    label: "AlexOS Midnight",
    description: "Deep command-center blue with a mountain option",
    backdrop: "mountains",
    accent: "blue",
  },
  aurora: {
    id: "aurora",
    label: "AlexOS Aurora",
    description: "Violet-to-cyan colour field without a photo backdrop",
    backdrop: "gradient",
    accent: "purple",
  },
  dailygear: {
    id: "dailygear",
    label: "DailyGear Operator",
    description: "Graphite workspace with DailyGear red accents",
    backdrop: "gradient",
    accent: "red",
  },
  paper: {
    id: "paper",
    label: "Paper Light",
    description: "Bright workspace for daylight and operations review",
    backdrop: "none",
    accent: "green",
  },
  custom: {
    id: "custom",
    label: "Custom accent",
    description: "Keep the layout and choose your own accent colour",
    backdrop: "gradient",
    accent: "custom",
  },
};
export const DEFAULT_VISUAL_THEME: VisualThemeId = "midnight";
export const DEFAULT_CUSTOM_ACCENT = "#4f7cff";
export function isVisualThemeId(value: string | null | undefined): value is VisualThemeId {
  return value !== null && value !== undefined && value in VISUAL_THEMES;
}
export function getVisualTheme(id: VisualThemeId) {
  return VISUAL_THEMES[id] ?? VISUAL_THEMES[DEFAULT_VISUAL_THEME];
}
