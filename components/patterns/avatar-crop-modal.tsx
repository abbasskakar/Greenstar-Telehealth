"use client";

import * as React from "react";
import { X, Check, Loader2, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";

const V = 280; // crop viewport (px)
const OUT = 512; // output size (px)

export function AvatarCropModal({
  file,
  onCancel,
  onCropped,
}: {
  file: File;
  onCancel: () => void;
  onCropped: (blob: Blob) => void | Promise<void>;
}) {
  const [src, setSrc] = React.useState("");
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const [nat, setNat] = React.useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const drag = React.useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setNat({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const baseScale = nat ? V / Math.min(nat.w, nat.h) : 1;
  const eff = baseScale * zoom;
  const dw = nat ? nat.w * eff : V;
  const dh = nat ? nat.h * eff : V;

  const clampPan = React.useCallback(
    (p: { x: number; y: number }) => {
      const mx = Math.max(0, (dw - V) / 2);
      const my = Math.max(0, (dh - V) / 2);
      return {
        x: Math.min(mx, Math.max(-mx, p.x)),
        y: Math.min(my, Math.max(-my, p.y)),
      };
    },
    [dw, dh],
  );

  React.useEffect(() => {
    setPan((p) => clampPan(p));
  }, [zoom, nat, clampPan]);

  function onDown(e: React.PointerEvent) {
    drag.current = { x: e.clientX, y: e.clientY, ox: pan.x, oy: pan.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (!drag.current) return;
    setPan(
      clampPan({
        x: drag.current.ox + (e.clientX - drag.current.x),
        y: drag.current.oy + (e.clientY - drag.current.y),
      }),
    );
  }
  function onUp() {
    drag.current = null;
  }

  const imgLeft = (V - dw) / 2 + pan.x;
  const imgTop = (V - dh) / 2 + pan.y;

  async function save() {
    if (!imgRef.current || !nat) return;
    setSaving(true);
    const sx = -imgLeft / eff;
    const sy = -imgTop / eff;
    const s = V / eff;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setSaving(false);
      return;
    }
    ctx.drawImage(imgRef.current, sx, sy, s, s, 0, 0, OUT, OUT);
    canvas.toBlob(
      async (blob) => {
        if (blob) await onCropped(blob);
        setSaving(false);
      },
      "image/jpeg",
      0.9,
    );
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-float">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-foreground">Adjust photo</h3>
          <button onClick={onCancel} aria-label="Cancel" className="text-muted-2 hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div
          className="relative mx-auto touch-none select-none overflow-hidden rounded-full border-2 border-primary/40 bg-surface-2"
          style={{ width: V, height: V, cursor: "grab" }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        >
          {src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                position: "absolute",
                width: dw,
                height: dh,
                left: imgLeft,
                top: imgTop,
                maxWidth: "none",
              }}
            />
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <ZoomIn size={18} className="text-muted" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
        </div>
        <p className="mt-1 text-center text-xs text-muted-2">Drag the photo to reposition</p>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={save} disabled={saving || !nat}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
