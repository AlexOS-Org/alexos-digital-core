import cityLights from "@/assets/visuals/alexos-city-lights-wide.webp";
import commandCenter from "@/assets/visuals/alexos-command-center-wide.webp";
import natureTrail from "@/assets/visuals/alexos-nature-trail-wide.webp";
import oceanWaves from "@/assets/visuals/alexos-ocean-waves-wide.webp";
import performanceCars from "@/assets/visuals/alexos-performance-cars-wide.webp";
import sportsArena from "@/assets/visuals/alexos-sports-arena-wide.webp";
import waterfall from "@/assets/visuals/alexos-waterfall-wide.webp";
import type { DashboardSceneId } from "./visual-scenes";

const DASHBOARD_SCENE_ASSETS: Record<Exclude<DashboardSceneId, "auto" | "none">, string> = {
  mountains: commandCenter,
  ocean: oceanWaves,
  basketball: sportsArena,
  cars: performanceCars,
  sports: sportsArena,
  city: cityLights,
  river: oceanWaves,
  nature: natureTrail,
  birds: natureTrail,
  waterfall,
  rocks: natureTrail,
  fish: oceanWaves,
  sunset: performanceCars,
  night: cityLights,
};

export function getDashboardSceneAsset(scene: Exclude<DashboardSceneId, "auto" | "none">) {
  return DASHBOARD_SCENE_ASSETS[scene];
}
