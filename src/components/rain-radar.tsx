"use client";

import { useEffect, useState, useRef } from "react";
import { CloudRain } from "lucide-react";

const LAT = 48.1351;
const LON = 11.582;
const ZOOM = 7;
const SIZE = 180;

type RadarFrame = { path: string; time: number };

function latLonToTile(lat: number, lon: number, zoom: number) {
  const n = 2 ** zoom;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

function tileToLatLon(x: number, y: number, zoom: number) {
  const n = 2 ** zoom;
  const lon = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const lat = (latRad * 180) / Math.PI;
  return { lat, lon };
}

export function RainRadar() {
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [frameIdx, setFrameIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const tile = latLonToTile(LAT, LON, ZOOM);

  useEffect(() => {
    fetch("https://api.rainviewer.com/public/weather-maps.json")
      .then((r) => r.json())
      .then((data) => {
        const past: RadarFrame[] = (data.radar?.past ?? []).slice(-6);
        const nowcast: RadarFrame[] = (data.radar?.nowcast ?? []).slice(0, 3);
        const all = [...past, ...nowcast];
        if (all.length === 0) return;
        setFrames(all);

        const imgs = all.map((f) => {
          const img = new Image();
          img.src = `https://tilecache.rainviewer.com${f.path}/256/${ZOOM}/${tile.x}/${tile.y}/4/1_1.png`;
          return img;
        });
        imgs[imgs.length - 1].onload = () => setLoaded(true);
      })
      .catch(() => {});
  }, [tile.x, tile.y]);

  useEffect(() => {
    if (!loaded || frames.length === 0) return;
    setFrameIdx(0);
    intervalRef.current = setInterval(() => {
      setFrameIdx((prev) => (prev + 1) % frames.length);
    }, 800);
    return () => clearInterval(intervalRef.current);
  }, [loaded, frames.length]);

  if (!loaded || frames.length === 0) return null;

  const frame = frames[frameIdx];
  const isPast = frameIdx < frames.length - 3;
  const time = new Date(frame.time * 1000);
  const timeStr = time.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });

  const baseTileUrl = `https://tile.openstreetmap.org/${ZOOM}/${tile.x}/${tile.y}.png`;
  const radarTileUrl = `https://tilecache.rainviewer.com${frame.path}/256/${ZOOM}/${tile.x}/${tile.y}/4/1_1.png`;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative overflow-hidden rounded-xl border border-border/60"
        style={{ width: SIZE, height: SIZE }}
      >
        {/* Base map tile */}
        <img
          src={baseTileUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-60 dark:opacity-40 dark:invert dark:hue-rotate-180"
          style={{ imageRendering: "auto" }}
        />
        {/* Radar overlay */}
        <img
          key={frame.path}
          src={radarTileUrl}
          alt="Rain radar"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ imageRendering: "auto" }}
        />
        {/* Crosshair for Munich */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-2 w-2 rounded-full bg-pitch-400 border border-white/80 shadow-sm" />
        </div>
        {/* Time label */}
        <div className="absolute bottom-1 left-1 rounded bg-bg/80 px-1.5 py-0.5 text-[9px] font-bold number-pill text-foreground backdrop-blur-sm">
          {timeStr}
          {!isPast && <span className="text-pitch-400 ml-1">forecast</span>}
        </div>
        {/* Progress dots */}
        <div className="absolute bottom-1 right-1 flex gap-0.5">
          {frames.map((_, i) => (
            <div
              key={i}
              className={`h-1 w-1 rounded-full transition ${
                i === frameIdx ? "bg-pitch-400" : i >= frames.length - 3 ? "bg-pitch-700/60" : "bg-foreground/20"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 text-[8px] uppercase tracking-widest text-muted/50">
        <CloudRain className="h-2.5 w-2.5" /> Rain Radar · RainViewer
      </div>
    </div>
  );
}
