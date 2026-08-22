export type VisualThemeId =
  "midnight" | "aurora" | "dailygear" | "paper" | "ocean" | "plum" | "copper" | "sage" | "custom";
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
    label: "AlexOS Midnight",
    description: "Deep command-center blue with a mountain option",
    backdrop: "mountains",
    accent: "blue",
    preview: { start: "#101a3a", end: "#273b78", accent: "#6ea8ff" },
  },
  aurora: {
    id: "aurora",
    label: "AlexOS Aurora",
    description: "Violet-to-cyan colour field without a photo backdrop",
    backdrop: "gradient",
    accent: "purple",
    preview: { start: "#24134e", end: "#135f75", accent: "#b48cff" },
  },
  dailygear: {
    id: "dailygear",
    label: "DailyGear Operator",
    description: "Graphite workspace with DailyGear red accents",
    backdrop: "gradient",
    accent: "red",
    preview: { start: "#261719", end: "#572426", accent: "#ff806f" },
  },
  paper: {
    id: "paper",
    label: "Paper Light",
    description: "Bright workspace for daylight and operations review",
    backdrop: "none",
    accent: "green",
    preview: { start: "#f7fbf6", end: "#dcefe7", accent: "#2d9b78" },
  },
  ocean: {
    id: "ocean",
    label: "Ocean Glass",
    description: "Calm teal surfaces with crisp blue navigation",
    backdrop: "gradient",
    accent: "blue",
    preview: { start: "#092d3b", end: "#176b79", accent: "#62d9df" },
  },
  plum: {
    id: "plum",
    label: "Plum Studio",
    description: "Editorial plum, lilac, and soft rose highlights",
    backdrop: "gradient",
    accent: "purple",
    preview: { start: "#29152f", end: "#633b73", accent: "#d8a7ff" },
  },
  copper: {
    id: "copper",
    label: "Copper Luxe",
    description: "Warm executive surfaces with copper signal accents",
    backdrop: "gradient",
    accent: "amber",
    preview: { start: "#302019", end: "#70452b", accent: "#ffc27b" },
  },
  sage: {
    id: "sage",
    label: "Sage Focus",
    description: "Quiet green workspace for planning and finance review",
    backdrop: "gradient",
    accent: "green",
    preview: { start: "#102d2a", end: "#326154", accent: "#8fe3ba" },
  },
  custom: {
    id: "custom",
    label: "Custom Accent",
    description: "Keep the layout and choose your own accent colour",
    backdrop: "gradient",
    accent: "custom",
    preview: { start: "#202337", end: "#394267", accent: "#7fa2ff" },
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
