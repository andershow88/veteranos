"use client";

import { useEffect, useState } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudDrizzle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type CurrentWeather = { temperature: number; code: number };
type DailyForecast = { date: string; dayName: string; code: number; tempMax: number; tempMin: number };
type WeatherData = { current: CurrentWeather; daily: DailyForecast[]; locationName: string };

const LAT = 48.1351;
const LON = 11.582;
const LOCATION = "Munich";

function wmoLabel(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 65) return "Rain";
  if (code <= 67) return "Freezing rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow showers";
  if (code <= 99) return "Thunderstorm";
  return "";
}

function WmoIcon({ code, className = "h-5 w-5" }: { code: number; className?: string }) {
  if (code === 0) return <Sun className={className} />;
  if (code <= 3) return <Cloud className={className} />;
  if (code <= 48) return <CloudFog className={className} />;
  if (code <= 57) return <CloudDrizzle className={className} />;
  if (code <= 67) return <CloudRain className={className} />;
  if (code <= 77) return <CloudSnow className={className} />;
  if (code <= 82) return <CloudRain className={className} />;
  if (code <= 86) return <CloudSnow className={className} />;
  if (code <= 99) return <CloudLightning className={className} />;
  return <Cloud className={className} />;
}

function dayShort(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
}

export function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);

  useEffect(() => {
    const cached = sessionStorage.getItem("vet-weather");
    if (cached) {
      try {
        const p = JSON.parse(cached);
        if (p._ts && Date.now() - p._ts < 30 * 60 * 1000) {
          // Hydrate from the fresh session cache on mount (intentional).
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setData(p);
          return;
        }
      } catch {}
    }

    const controller = new AbortController();
    const url =
      `https://api.open-meteo.com/v1/dwd-icon?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,weather_code` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&timezone=Europe/Berlin&forecast_days=5`;

    fetch(url, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
        const result: WeatherData = {
          current: { temperature: Math.round(json.current.temperature_2m), code: json.current.weather_code },
          daily: json.daily.time.map((date: string, i: number) => ({
            date,
            dayName: dayShort(date),
            code: json.daily.weather_code[i],
            tempMax: Math.round(json.daily.temperature_2m_max[i]),
            tempMin: Math.round(json.daily.temperature_2m_min[i]),
          })),
          locationName: LOCATION,
        };
        setData(result);
        sessionStorage.setItem("vet-weather", JSON.stringify({ ...result, _ts: Date.now() }));
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 shrink-0 lg:items-end">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-10" />
          ))}
        </div>
      </div>
    );
  }

  const forecast = data.daily.slice(1);

  return (
    <div className="flex flex-col items-center lg:items-end gap-3 shrink-0">
      {/* Current */}
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-pitch-700/30 text-pitch-300">
          <WmoIcon code={data.current.code} className="h-6 w-6" />
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-foreground number-pill leading-none">
            {data.current.temperature}°C
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted mt-0.5">
            {data.locationName} · {wmoLabel(data.current.code)}
          </div>
        </div>
      </div>

      {/* Forecast */}
      <div className="flex items-center gap-3">
        {forecast.map((d) => (
          <div key={d.date} className="flex flex-col items-center gap-0.5 min-w-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{d.dayName}</span>
            <WmoIcon code={d.code} className="h-4 w-4 text-pitch-300" />
            <div className="text-[10px] number-pill text-foreground leading-tight">
              <span className="font-semibold">{d.tempMax}°</span>
              <span className="text-muted ml-0.5">{d.tempMin}°</span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-[10px] uppercase tracking-widest text-muted">
        DWD · Open-Meteo
      </div>
    </div>
  );
}
