export function dashboardTrendRailMagnitudeClass(change: number) {
  const magnitude = Math.abs(change);
  if (magnitude >= 75) return "w-full";
  if (magnitude >= 50) return "w-3/4";
  if (magnitude >= 25) return "w-1/2";
  if (magnitude >= 10) return "w-1/4";
  return "w-1/12";
}
