"use client";

import { useEffect, useState, useRef } from "react";
import { CloudRain } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const LAT = 48.1351;
const LON = 11.582;
const ZOOM = 7; // ~300 km view — the broad cloud picture, like before
const TILE = 256;
const MAP_W = 248; // wider (landscape) map box
const MAP_H = 168;

type RadarFrame = { path: string; time: number };

// Web-mercator tile coordinates (float) for a lat/lon at a given zoom.
function lonToTileX(lon: number, z: number) {
  return ((lon + 180) / 360) * 2 ** z;
}
function latToTileY(lat: number, z: number) {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z;
}

export function RainRadar() {
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [frameIdx, setFrameIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Centre the map box on Munich: compute the viewport's top-left in world
  // pixels, then list the tiles that cover it with their screen offsets. This
  // keeps Munich (the marker) dead-centre instead of at a tile edge.
  const cx = lonToTileX(LON, ZOOM) * TILE;
  const cy = latToTileY(LAT, ZOOM) * TILE;
  const originX = cx - MAP_W / 2;
  const originY = cy - MAP_H / 2;
  const tiles: { tx: number; ty: number; left: number; top: number }[] = [];
  for (let tx = Math.floor(originX / TILE); tx <= Math.floor((originX + MAP_W) / TILE); tx++) {
    for (let ty = Math.floor(originY / TILE); ty <= Math.floor((originY + MAP_H) / TILE); ty++) {
      tiles.push({ tx, ty, left: tx * TILE - originX, top: ty * TILE - originY });
    }
  }
  const centerTx = Math.floor(cx / TILE);
  const centerTy = Math.floor(cy / TILE);

  useEffect(() => {
    fetch("https://api.rainviewer.com/public/weather-maps.json")
      .then((r) => r.json())
      .then((data) => {
        const past: RadarFrame[] = (data.radar?.past ?? []).slice(-6);
        const nowcast: RadarFrame[] = (data.radar?.nowcast ?? []).slice(0, 3);
        const all = [...past, ...nowcast];
        if (all.length === 0) return;
        setFrames(all);
        // Wait for the centre radar tile of the latest frame before animating.
        const img = new Image();
        img.src = `https://tilecache.rainviewer.com${all[all.length - 1].path}/256/${ZOOM}/${centerTx}/${centerTy}/4/1_1.png`;
        img.onload = () => setLoaded(true);
        img.onerror = () => setLoaded(true);
      })
      .catch(() => {});
  }, [centerTx, centerTy]);

  useEffect(() => {
    if (!loaded || frames.length === 0) return;
    // Restart the animation from the first frame when a new set loads (intentional).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFrameIdx(0);
    intervalRef.current = setInterval(() => {
      setFrameIdx((prev) => (prev + 1) % frames.length);
    }, 800);
    return () => clearInterval(intervalRef.current);
  }, [loaded, frames.length]);

  if (!loaded || frames.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <Skeleton className="rounded-xl" style={{ width: MAP_W, height: MAP_H }} />
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted">
          <CloudRain className="h-2.5 w-2.5" /> Rain Radar · RainViewer
        </div>
      </div>
    );
  }

  const frame = frames[frameIdx];
  const isPast = frameIdx < frames.length - 3;
  const time = new Date(frame.time * 1000);
  const timeStr = time.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative overflow-hidden rounded-xl border border-border/60"
        style={{ width: MAP_W, height: MAP_H }}
      >
        {/* Base map tiles */}
        {tiles.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`b-${t.tx}-${t.ty}`}
            src={`https://tile.openstreetmap.org/${ZOOM}/${t.tx}/${t.ty}.png`}
            alt=""
            className="absolute max-w-none opacity-60 dark:opacity-40 dark:invert dark:hue-rotate-180"
            style={{ left: t.left, top: t.top, width: TILE, height: TILE }}
          />
        ))}
        {/* Radar overlay tiles */}
        {tiles.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`r-${frame.path}-${t.tx}-${t.ty}`}
            src={`https://tilecache.rainviewer.com${frame.path}/256/${ZOOM}/${t.tx}/${t.ty}/4/1_1.png`}
            alt=""
            className="absolute max-w-none"
            style={{ left: t.left, top: t.top, width: TILE, height: TILE }}
          />
        ))}
        {/* Marker — dead centre = Munich */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-2.5 w-2.5 rounded-full bg-pitch-400 border-2 border-white shadow" />
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
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted">
        <CloudRain className="h-2.5 w-2.5" /> Rain Radar · RainViewer
      </div>
    </div>
  );
}
