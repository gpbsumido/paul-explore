"use client";

import { useState, useEffect } from "react";

export type WeatherCondition =
  | "clear" // WMO 0,1
  | "partly-cloudy" // WMO 2,3
  | "fog" // WMO 45,48
  | "rain" // WMO 51-82 (drizzle, rain, showers)
  | "snow" // WMO 71-86 (snow, ice pellets, snow showers)
  | "storm" // WMO 95-99
  | "unknown";

/** Maps an Open-Meteo WMO weather code to our WeatherCondition enum. */
function wmoToCondition(code: number): WeatherCondition {
  if (code <= 1) return "clear";
  if (code <= 3) return "partly-cloudy";
  if (code === 45 || code === 48) return "fog";
  // Snow: 71-77 (snow fall), 85-86 (snow showers)
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  // Storm: 95-99
  if (code >= 95) return "storm";
  // Rain / drizzle / freezing rain / showers: 51-82
  if (code >= 51 && code <= 82) return "rain";
  return "unknown";
}

export interface WeatherInfo {
  condition: WeatherCondition;
  temperature: number | null;
  city: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Detects the user's approximate location via IP geolocation (ipapi.co — no
 * browser permission needed), then fetches current weather from Open-Meteo
 * (free, no API key).
 */
export function useWeather(): WeatherInfo {
  const [info, setInfo] = useState<WeatherInfo>({
    condition: "unknown",
    temperature: null,
    city: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function detect() {
      try {
        // Step 1: IP-based geolocation via our backend proxy, avoids CORS.
        const geoRes = await fetch("/api/geo", { signal });
        if (!geoRes.ok) throw new Error(`geo unavailable (${geoRes.status})`);
        const geo = await geoRes.json();

        const lat: unknown = geo.latitude;
        const lon: unknown = geo.longitude;
        const city: unknown = geo.city;
        if (typeof lat !== "number" || typeof lon !== "number") {
          throw new Error(
            `invalid geo payload, lat=${JSON.stringify(lat)} lon=${JSON.stringify(lon)}`,
          );
        }

        // Step 2: Open-Meteo weather (free, no key required).
        const meteoUrl =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
          `&current=weather_code,temperature_2m`;
        const meteoRes = await fetch(meteoUrl, { signal });
        if (!meteoRes.ok)
          throw new Error(`meteo unavailable (${meteoRes.status})`);
        const meteo = await meteoRes.json();

        const code: unknown = meteo?.current?.weather_code;
        const temp: unknown = meteo?.current?.temperature_2m;

        setInfo({
          condition:
            typeof code === "number" ? wmoToCondition(code) : "unknown",
          temperature: typeof temp === "number" ? Math.round(temp) : null,
          city: typeof city === "string" ? city : null,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (signal.aborted) return;
        setInfo((prev) => ({
          ...prev,
          condition: "unknown",
          loading: false,
          error: err instanceof Error ? err.message : String(err),
        }));
      }
    }

    detect();
    return () => controller.abort();
  }, []);

  return info;
}
