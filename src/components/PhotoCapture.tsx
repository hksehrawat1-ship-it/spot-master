import { useRef, useState } from "react";
import { Camera, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

async function downscale(file: File, max = 900, quality = 0.6): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Upload failed. Please try again."));
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("That image could not be read. Please retake the photo."));
    i.src = dataUrl;
  });
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export default function PhotoCapture({
  label,
  hint,
  value,
  onChange,
  onRemove,
}: {
  label: string;
  hint?: string;
  value?: string;
  onChange: (dataUrl: string) => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{label}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {value ? (
          <div className="flex items-center gap-2">
            <img src={value} alt={`${label} preview`} className="h-14 w-14 rounded-lg object-cover" />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Remove ${label}`}
              onClick={() => {
                onRemove();
                setError(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => ref.current?.click()}
            aria-label={`Add photo: ${label}`}
          >
            <Camera className="mr-1 h-4 w-4" /> {busy ? "Adding…" : "Add photo"}
          </Button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          setError(null);
          try {
            if (!file.type.startsWith("image/")) throw new Error("That file is not an image.");
            onChange(await downscale(file));
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Camera or upload failed. Check camera permission, or choose a photo from your gallery.",
            );
          } finally {
            setBusy(false);
          }
        }}
      />
      {error && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-destructive" role="alert">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error} Your answers are kept.
        </p>
      )}
    </div>
  );
}
