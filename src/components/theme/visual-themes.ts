export type VisualThemeId =
  | "midnight"
  | "aurora"
  | "dailygear"
  | "paper"
  | "ocean"
  | "ocean_mountain"
  | "plum"
  | "copper"
  | "sage"
  | "opsmind"
  | "droneview"
  | "pulseai"
  | "pricepilot"
  | "finai"
  | "custom";
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
  ocean_mountain: {
    id: "ocean_mountain",
    label: "Ocean Mountain",
    description: "4K mountain backdrop with cool ocean atmosphere",
    backdrop: "mountains",
    accent: "blue",
    preview: { start: "#082f49", end: "#0f766e", accent: "#67e8f9" },
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
  opsmind: {
    id: "opsmind",
    label: "OpsMind Command",
    description: "Black glass command centre with electric violet signals",
    backdrop: "gradient",
    accent: "purple",
    preview: { start: "#07070b", end: "#22113e", accent: "#c855ff" },
  },
  droneview: {
    id: "droneview",
    label: "DroneView Ember",
    description: "Smoky operations view with ember-orange alerts and telemetry",
    backdrop: "mountains",
    accent: "amber",
    preview: { start: "#171312", end: "#5b2b1b", accent: "#ff8a4c" },
  },
  pulseai: {
    id: "pulseai",
    label: "PulseAI Warm Light",
    description: "Cream analytics workspace with soft peach chart emphasis",
    backdrop: "none",
    accent: "amber",
    preview: { start: "#fffaf2", end: "#f8ded1", accent: "#e9792c" },
  },
  pricepilot: {
    id: "pricepilot",
    label: "PricePilot Lavender",
    description: "Airy watchlist workspace with lavender performance cues",
    backdrop: "none",
    accent: "purple",
    preview: { start: "#f4f2f8", end: "#ffffff", accent: "#8b5cf6" },
  },
  finai: {
    id: "finai",
    label: "FinAI Neon Ledger",
    description: "Deep navy finance wall with cyan and pink movement signals",
    backdrop: "gradient",
    accent: "blue",
    preview: { start: "#071126", end: "#142461", accent: "#44d9ff" },
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

/**
 * The visible presets are intentionally curated. Legacy theme IDs remain in the registry so
 * existing saved preferences and exported presets continue to resolve safely.
 */
export const CURATED_VISUAL_THEME_IDS: readonly VisualThemeId[] = [
  "midnight",
  "ocean_mountain",
  "dailygear",
  "paper",
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
