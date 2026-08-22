import { Cloud, CloudSun, Droplets, Moon, Sun, Sunrise, Sunset, Wind } from "lucide-react";
import type { LocalWeatherSnapshot } from "@/components/dashboard/greeting-context";

function weatherLabel(code: number) {
  if (code === 0) return "Clear sky";
  if ([1, 2].includes(code)) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if ([45, 48].includes(code)) return "Misty";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
  if ([80, 81, 82].includes(code)) return "Rain showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Changing skies";
}

function WeatherIcon({ code, night }: { code: number; night: boolean }) {
  if (night) return <Moon className="h-4 w-4" />;
  if (code === 0) return <Sun className="h-4 w-4" />;
  if ([1, 2].includes(code)) return <CloudSun className="h-4 w-4" />;
  return <Cloud className="h-4 w-4" />;
}

function formatClock(value: string) {
  return new Date(value).toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function DashboardWeather({ snapshot }: { snapshot: LocalWeatherSnapshot }) {
  const { weather, night } = snapshot;
  if (!weather || night === null) return null;

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-white/75">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 backdrop-blur-md">
        <WeatherIcon code={weather.weatherCode} night={night} />
        <span className="font-medium text-white">{Math.round(weather.temperature)}°C</span>
        <span>{night ? "Night sky" : weatherLabel(weather.weatherCode)}</span>
      </div>
      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 backdrop-blur-md">
        {weather.cloudCover >= 60 ? (
          <Cloud className="h-3.5 w-3.5" />
        ) : (
          <Wind className="h-3.5 w-3.5" />
        )}
        <span>{weather.cloudCover}% clouds</span>
        <span>·</span>
        <span>{Math.round(weather.windSpeed)} km/h wind</span>
      </div>
      <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 backdrop-blur-md">
        <span className="inline-flex items-center gap-1">
          <Sunrise className="h-3.5 w-3.5 text-amber-200" />
          {formatClock(weather.sunrise)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Sunset className="h-3.5 w-3.5 text-orange-200" />
          {formatClock(weather.sunset)}
        </span>
      </div>
      {weather.precipitation > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 backdrop-blur-md">
          <Droplets className="h-3.5 w-3.5 text-sky-200" />
          {weather.precipitation.toFixed(1)} mm now
        </span>
      )}
    </div>
  );
}
