export type VisualThemeId = "midnight" | "ocean_mountain" | "finai" | "aurora" | "custom";

export type VisualBackdrop = "mountains" | "gradient" | "none";

export type VisualTheme = {
  id: VisualThemeId;
  label: string;
  description: string;
  backdrop: VisualBackdrop;
  accent: "blue" | "purple" | "red" | "green" | "amber" | "custom";
  preview: {
    start: string;
    end: string;
    accent: string;
  };
};

export const VISUAL_THEMES: Record<VisualThemeId, VisualTheme> = {
  midnight: {
    id: "midnight",
    label: "Horizon Command",
    description: "Deep navy command centre with alpine depth and glass surfaces",
    backdrop: "mountains",
    accent: "blue",
    preview: { start: "#0b1224", end: "#1d3a66", accent: "#67b7ff" },
  },
  ocean_mountain: {
    id: "ocean_mountain",
    label: "Alpine Ocean",
    description: "Mountain scene, ocean blue surfaces and calm cyan signals",
    backdrop: "mountains",
    accent: "blue",
    preview: { start: "#071b34", end: "#0f766e", accent: "#67e8f9" },
  },
  finai: {
    id: "finai",
    label: "Neon Ledger",
    description: "Obsidian finance workspace with cyan and magenta chart signals",
    backdrop: "gradient",
    accent: "blue",
    preview: { start: "#060b18", end: "#18245a", accent: "#44d9ff" },
  },
  aurora: {
    id: "aurora",
    label: "Electric Aurora",
    description: "Dark violet glass with a controlled cyan signal layer",
    backdrop: "gradient",
    accent: "purple",
    preview: { start: "#120e2b", end: "#143c59", accent: "#b48cff" },
  },
  custom: {
    id: "custom",
    label: "Studio Custom",
    description: "Keep the premium workspace and tune one controlled accent",
    backdrop: "gradient",
    accent: "custom",
    preview: { start: "#111827", end: "#273b78", accent: "#7fa2ff" },
  },
};

export const CURATED_VISUAL_THEME_IDS: readonly VisualThemeId[] = [
  "midnight",
  "ocean_mountain",
  "finai",
  "aurora",
  "custom",
];

export const DEFAULT_VISUAL_THEME: VisualThemeId = "midnight";
export const DEFAULT_CUSTOM_ACCENT = "#4f7cff";

export function isVisualThemeId(value: string | null | undefined): value is VisualThemeId {
  return value !== null && value !== undefined && value in VISUAL_THEMES;
}

export function getVisualTheme(id: VisualThemeId) {
  return VISUAL_THEMES[id] ?? VISUAL_THEMES[DEFAULT_VISUAL_THEME];
}
