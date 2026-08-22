import { useEffect, useMemo, useState } from "react";

export type DashboardLocation = {
  latitude: number;
  longitude: number;
  label: string;
};

export type LocalWeather = {
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  cloudCover: number;
  windSpeed: number;
  precipitation: number;
  sunrise: string;
  sunset: string;
};

export type LocalWeatherSnapshot = {
  location: DashboardLocation;
  weather: LocalWeather | null;
  night: boolean | null;
};

export const NAIROBI_FALLBACK: DashboardLocation = {
  latitude: -1.286389,
  longitude: 36.817223,
  label: "Nairobi",
};

const WEATHER_HOST = ["https://api", "open-meteo.com/v1/forecast"].join(".");

type UseLocalWeatherOptions = {
  requestBrowserLocation?: boolean;
};

export function useLocalWeather({ requestBrowserLocation = true }: UseLocalWeatherOptions = {}) {
  const [location, setLocation] = useState<DashboardLocation>(NAIROBI_FALLBACK);
  const [weather, setWeather] = useState<LocalWeather | null>(null);

  useEffect(() => {
    if (!requestBrowserLocation || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          label: "Your location",
        }),
      () => undefined,
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 30 * 60 * 1000 },
    );
  }, [requestBrowserLocation]);

  useEffect(() => {
    const controller = new AbortController();
    const url = new URL(WEATHER_HOST);
    url.search = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      current:
        "temperature_2m,apparent_temperature,weather_code,cloud_cover,wind_speed_10m,precipitation",
      daily: "sunrise,sunset",
      timezone: "auto",
      forecast_days: "1",
    }).toString();

    fetch(url, { signal: controller.signal })
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error("Weather unavailable")),
      )
      .then((data) =>
        setWeather({
          temperature: data.current.temperature_2m,
          apparentTemperature: data.current.apparent_temperature,
          weatherCode: data.current.weather_code,
          cloudCover: data.current.cloud_cover,
          windSpeed: data.current.wind_speed_10m,
          precipitation: data.current.precipitation,
          sunrise: data.daily.sunrise[0],
          sunset: data.daily.sunset[0],
        }),
      )
      .catch(() => undefined);

    return () => controller.abort();
  }, [location.latitude, location.longitude]);

  const night = useMemo(() => {
    if (!weather) return null;
    const now = new Date();
    const sunrise = new Date(weather.sunrise);
    const sunset = new Date(weather.sunset);
    return now < sunrise || now >= sunset;
  }, [weather]);

  return { location, weather, night } satisfies LocalWeatherSnapshot;
}
