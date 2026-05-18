"use client";

import { useEffect, useState } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudDrizzle, Wind, Droplets } from "lucide-react";

type CurrentWeather = {
  temperature: number;
  code: number;
};

type DailyForecast = {
  date: string;
  dayName: string;
  code: number;
  tempMax: number;
  tempMin: number;
};

type WeatherData = {
  current: CurrentWeather;
  daily: DailyForecast[];
  locationName: string;
};

const LAT = 48.1351;
const LON = 11.582;
const LOCATION = "Munich";

function wmoLabel(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Fog";
  if (code <= 55) return "Drizzle";
  if (code <= 57) return "Freezing drizzle";
  if (code <= 65) return "Rain";
  if (code <= 67) return "Freezing rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
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
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem("vet-weather");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed._ts && Date.now() - parsed._ts < 30 * 60 * 1000) {
          setData(parsed);
          return;
        }
      } catch {}
    }

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,weather_code` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&timezone=Europe/Berlin&forecast_days=5`;

    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        const result: WeatherData = {
          current: {
            temperature: Math.round(json.current.temperature_2m),
            code: json.current.weather_code,
          },
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
      .catch(() => setError(true));
  }, []);

  if (error || !data) return null;

  const today = data.daily[0];
  const forecast = data.daily.slice(1);

  return (
    <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4">
      {/* Current */}
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-pitch-700/30 text-pitch-300">
          <WmoIcon code={data.current.code} className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground number-pill">
            {data.current.temperature}°
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted">
            {data.locationName} · {wmoLabel(data.current.code)}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden sm:block h-10 w-px bg-border/60" />

      {/* 4-day forecast */}
      <div className="flex items-center gap-3">
        {forecast.map((d) => (
          <div key={d.date} className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted">{d.dayName}</span>
            <WmoIcon code={d.code} className="h-4 w-4 text-pitch-300" />
            <div className="text-[10px] number-pill text-foreground">
              <span className="font-semibold">{d.tempMax}°</span>
              <span className="text-muted ml-0.5">{d.tempMin}°</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
