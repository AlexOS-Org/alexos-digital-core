export type GreetingTriggerId = "time" | "weather" | "geolocation";

export type DashboardSceneId =
  "auto" | "none" | "mountains" | "ocean" | "basketball" | "sunset" | "night";

export type DashboardScene = {
  id: DashboardSceneId;
  label: string;
  description: string;
  preview: {
    start: string;
    end: string;
    accent: string;
  };
};

export const DASHBOARD_SCENES: Record<DashboardSceneId, DashboardScene> = {
  auto: {
    id: "auto",
    label: "Time-aware rotation",
    description: "Change the greeting scene with the time of day",
    preview: { start: "#0d1830", end: "#6b3d71", accent: "#f4b860" },
  },
  none: {
    id: "none",
    label: "Clean gradient",
    description: "Use the selected theme without a decorative scene",
    preview: { start: "#161b2e", end: "#2b365d", accent: "#8ea7ff" },
  },
  mountains: {
    id: "mountains",
    label: "Mountain command",
    description: "Use the existing AlexOS mountain command-centre image",
    preview: { start: "#0d2038", end: "#1f6e72", accent: "#73d7d2" },
  },
  ocean: {
    id: "ocean",
    label: "Ocean waves",
    description: "Cool layered wave lines for calm operating views",
    preview: { start: "#071b34", end: "#0e7184", accent: "#5ce1e6" },
  },
  basketball: {
    id: "basketball",
    label: "Basketball energy",
    description: "Warm court-inspired motion for active planning days",
    preview: { start: "#21131c", end: "#9a4628", accent: "#ff9f5b" },
  },
  sunset: {
    id: "sunset",
    label: "Sunset focus",
    description: "Copper, rose, and violet close-of-day atmosphere",
    preview: { start: "#24152c", end: "#813b45", accent: "#ffb36a" },
  },
  night: {
    id: "night",
    label: "Night focus",
    description: "Low-light navy backdrop for evening review",
    preview: { start: "#050815", end: "#182c58", accent: "#7195ff" },
  },
};

export const DEFAULT_DASHBOARD_SCENE: DashboardSceneId = "auto";
export const DEFAULT_GREETING_TRIGGER: GreetingTriggerId = "time";

export const GREETING_TRIGGERS: Record<
  GreetingTriggerId,
  { id: GreetingTriggerId; label: string; description: string }
> = {
  time: {
    id: "time",
    label: "Time of day",
    description: "Morning, day, evening, and night rotation",
  },
  weather: {
    id: "weather",
    label: "Local weather",
    description: "Use current sky and precipitation conditions",
  },
  geolocation: {
    id: "geolocation",
    label: "Geolocation",
    description: "Use the browser-approved latitude and longitude",
  },
};

export function isDashboardSceneId(value: string | null | undefined): value is DashboardSceneId {
  return value !== null && value !== undefined && value in DASHBOARD_SCENES;
}

export function getActiveDashboardScene(
  selected: DashboardSceneId,
  hour: number,
  themeBackdrop: "mountains" | "gradient" | "none",
): Exclude<DashboardSceneId, "auto"> {
  if (selected !== "auto") return selected;
  if (themeBackdrop === "mountains") return "mountains";
  if (hour >= 5 && hour < 11) return "ocean";
  if (hour >= 11 && hour < 17) return "basketball";
  if (hour >= 17 && hour < 21) return "sunset";
  return "night";
}

export function getDashboardSceneLabel(id: DashboardSceneId) {
  return DASHBOARD_SCENES[id]?.label ?? DASHBOARD_SCENES[DEFAULT_DASHBOARD_SCENE].label;
}

export function getGreetingScene(
  trigger: GreetingTriggerId,
  hour: number,
  themeBackdrop: "mountains" | "gradient" | "none",
  weather?: { weatherCode: number; night: boolean | null } | null,
  location?: { latitude: number; longitude: number } | null,
): Exclude<DashboardSceneId, "auto"> {
  if (trigger === "weather" && weather) {
    if (weather.night) return "night";
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weather.weatherCode)) {
      return "ocean";
    }
    if ([95, 96, 99].includes(weather.weatherCode)) return "night";
    return "basketball";
  }

  if (trigger === "geolocation" && location) {
    if (Math.abs(location.latitude) <= 23.5) return "ocean";
    if (location.longitude >= 0) return "basketball";
    return "sunset";
  }

  return getActiveDashboardScene("auto", hour, themeBackdrop);
}
