export type VisualThemeId = "midnight";

export type VisualBackdrop = "mountains" | "gradient" | "none";

export type VisualTheme = {
  id: VisualThemeId;
  label: string;
  description: string;
  backdrop: VisualBackdrop;
  accent: "blue";
  preview: {
    start: string;
    end: string;
    accent: string;
  };
};

export const VISUAL_THEMES: Record<VisualThemeId, VisualTheme> = {
  midnight: {
    id: "midnight",
    label: "AlexOS Premium",
    description: "One consistent navy workspace with scene-aware glass surfaces",
    backdrop: "mountains",
    accent: "blue",
    preview: { start: "#071528", end: "#1d4670", accent: "#67b7ff" },
  },
};

export const CURATED_VISUAL_THEME_IDS: readonly VisualThemeId[] = ["midnight"];
export const DEFAULT_VISUAL_THEME: VisualThemeId = "midnight";
export const DEFAULT_CUSTOM_ACCENT = "#4f7cff";

export function isVisualThemeId(value: string | null | undefined): value is VisualThemeId {
  return value === "midnight";
}

export function getVisualTheme(id: VisualThemeId) {
  return VISUAL_THEMES[id] ?? VISUAL_THEMES[DEFAULT_VISUAL_THEME];
}
