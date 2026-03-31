"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useWeather, type WeatherCondition } from "@/hooks/useWeather";

export type EffectChoice = WeatherCondition | "auto";

export interface WeatherCtx {
  condition: WeatherCondition;
  temperature: number | null;
  city: string | null;
  loading: boolean;
  enabled: boolean;
  toggle: () => void;
  /** "auto" means use the detected geolocation condition; otherwise a forced override. */
  selectedEffect: EffectChoice;
  setSelectedEffect: (v: EffectChoice) => void;
  /** The condition that is actually rendered — resolves "auto" to the detected condition. */
  activeCondition: WeatherCondition;
}

/** Safe default — returned when consumed outside a WeatherProvider. */
const WeatherContext = createContext<WeatherCtx>({
  condition: "unknown",
  temperature: null,
  city: null,
  loading: false,
  enabled: true,
  toggle: () => {},
  selectedEffect: "auto",
  setSelectedEffect: () => {},
  activeCondition: "unknown",
});

export function WeatherProvider({ children }: { children: ReactNode }) {
  const weather = useWeather();

  // Lazy initializers read localStorage synchronously on the client so the
  // first render already reflects the persisted preference (no flash).
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("weather-fx-enabled");
    return saved !== null ? saved === "true" : true;
  });
  const [selectedEffect, setSelectedEffectState] = useState<EffectChoice>(
    () => {
      if (typeof window === "undefined") return "auto";
      const saved = localStorage.getItem("weather-fx-effect");
      return (saved as EffectChoice) ?? "auto";
    },
  );

  const toggle = () =>
    setEnabled((v) => {
      const next = !v;
      localStorage.setItem("weather-fx-enabled", String(next));
      return next;
    });

  const setSelectedEffect = (v: EffectChoice) => {
    setSelectedEffectState(v);
    localStorage.setItem("weather-fx-effect", v);
  };

  const activeCondition: WeatherCondition =
    selectedEffect === "auto" ? weather.condition : selectedEffect;

  return (
    <WeatherContext.Provider
      value={{
        condition: weather.condition,
        temperature: weather.temperature,
        city: weather.city,
        loading: weather.loading,
        enabled,
        toggle,
        selectedEffect,
        setSelectedEffect,
        activeCondition,
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeatherContext(): WeatherCtx {
  return useContext(WeatherContext);
}
