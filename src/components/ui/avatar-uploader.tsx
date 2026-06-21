"use client";

import { useRef, useState, useTransition, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { Camera, Trash2, X, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "./button";
import { Avatar } from "./avatar";
import { Alert } from "@/components/ui/alert";
import { useConfirm } from "./confirm-dialog";
import {
  updateAvatarAction,
  removeAvatarAction,
} from "@/server/avatar-actions";

type Props = {
  playerId: string;
  firstName: string;
  lastName?: string | null;
  currentUrl: string | null;
};

const OUTPUT_SIZE = 256;
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB raw upload

export function AvatarUploader({ playerId, firstName, lastName, currentUrl }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { confirm, dialog } = useConfirm();

  const onCropComplete = useCallback((_: Area, area: Area) => {
    setAreaPixels(area);
  }, []);

  const close = useCallback(() => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAreaPixels(null);
    setError(null);
    if (fileInput.current) fileInput.current.value = "";
  }, []);

  // Dismiss the crop modal with Escape (matches the ConfirmDialog pattern).
  useEffect(() => {
    if (!imageSrc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [imageSrc, close]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Image is too large (max 8 MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.onerror = () => setError("Could not read file.");
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!imageSrc || !areaPixels) return;
    setError(null);
    startTransition(async () => {
      try {
        const dataUrl = await renderCroppedImage(imageSrc, areaPixels);
        await updateAvatarAction(playerId, dataUrl);
        close();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  const remove = async () => {
    const ok = await confirm({
      title: "Remove photo?",
      description: "Your avatar will fall back to your initials.",
      confirmText: "Remove photo",
      variant: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        await removeAvatarAction(playerId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to remove");
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={pending}
        >
          <Camera className="h-3.5 w-3.5" />
          {currentUrl ? "Change photo" : "Add photo"}
        </Button>
        {currentUrl && (
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={remove}
            disabled={pending}
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Remove
          </Button>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
        />
      </div>

      {error && (
        <Alert tone="danger">{error}</Alert>
      )}

      {imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="crop-title"
            className="w-full max-w-md rounded-2xl glass shadow-2xl overflow-hidden"
          >
            <header className="flex items-center justify-between px-5 py-3 border-b border-border/60">
              <h3 id="crop-title" className="font-display text-xl tracking-wide">Adjust photo</h3>
              <button
                type="button"
                onClick={close}
                className="text-muted hover:text-foreground transition"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="px-5 py-4 space-y-4">
              <div className="relative h-72 w-full overflow-hidden rounded-xl bg-black">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  minZoom={1}
                  maxZoom={4}
                  restrictPosition={true}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted">
                  <span className="inline-flex items-center gap-1">
                    <ZoomOut className="h-3 w-3" /> Zoom
                  </span>
                  <span className="inline-flex items-center gap-1 number-pill">
                    {zoom.toFixed(2)}×
                    <ZoomIn className="h-3 w-3" />
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-pitch-500"
                />
                <p className="text-[11px] text-subtle">
                  Drag the image to reposition · use the slider or pinch to zoom.
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 pt-2">
                <Avatar
                  firstName={firstName}
                  lastName={lastName}
                  size="lg"
                  src={imageSrc}
                />
                <span className="text-xs text-muted">Live preview is in the cropper above. Saved as a circle.</span>
              </div>

              {error && (
                <Alert tone="danger">{error}</Alert>
              )}
            </div>

            <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border/60">
              <Button type="button" size="sm" variant="outline" onClick={close} disabled={pending}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={save} disabled={pending || !areaPixels}>
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Save photo
              </Button>
            </footer>
          </div>
        </div>
      )}

      {dialog}
    </div>
  );
}

async function renderCroppedImage(src: string, area: Area): Promise<string> {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  // JPEG keeps the data URL small. ~30-60 KB for a face photo at 0.85 quality.
  return canvas.toDataURL("image/jpeg", 0.85);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}
