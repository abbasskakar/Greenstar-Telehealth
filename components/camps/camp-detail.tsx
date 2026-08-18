"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Users, Camera, Loader2, CheckCircle2, ImageIcon, Boxes } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { createClient } from "@/lib/supabase/client";
import { campMeta } from "@/lib/constants/camps";
import { updateCamp } from "@/app/camps/actions";
import { cn } from "@/lib/utils";

export type Camp = {
  id: string;
  type: string;
  actual_turnout: number | null;
  counters: Record<string, number>;
  photos: string[];
  status: string;
  stock?: Record<string, { available?: number; used?: number }>;
};

type StockRow = { item: string; available: string; used: string };

const STATUSES = ["scheduled", "active", "completed"];

export function CampDetail({ camp }: { camp: Camp }) {
  const router = useRouter();
  const meta = campMeta(camp.type);
  const [turnout, setTurnout] = React.useState(camp.actual_turnout?.toString() ?? "");
  const [counter, setCounter] = React.useState(
    (camp.counters?.[meta.counter] ?? "").toString(),
  );
  const [status, setStatus] = React.useState(camp.status);
  const [photos, setPhotos] = React.useState<string[]>(camp.photos ?? []);
  const [busy, setBusy] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [stock, setStock] = React.useState<StockRow[]>(
    Object.entries(camp.stock ?? {}).map(([item, v]) => ({
      item,
      available: (v.available ?? "").toString(),
      used: (v.used ?? "").toString(),
    })),
  );
  const [stockBusy, setStockBusy] = React.useState(false);

  async function saveStock() {
    setStockBusy(true);
    const obj: Record<string, { available: number; used: number }> = {};
    stock.forEach((r) => {
      if (r.item.trim())
        obj[r.item.trim()] = { available: Number(r.available) || 0, used: Number(r.used) || 0 };
    });
    await updateCamp(camp.id, { stock: obj });
    setStockBusy(false);
    router.refresh();
  }

  async function save() {
    setBusy(true);
    await updateCamp(camp.id, {
      actual_turnout: turnout ? Number(turnout) : null,
      counters: { ...camp.counters, [meta.counter]: counter ? Number(counter) : 0 },
      status,
      photos,
    });
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    router.refresh();
  }

  async function uploadPhotos(files: FileList) {
    setUploading(true);
    const supabase = createClient();
    const added: string[] = [];
    for (const f of Array.from(files)) {
      const path = `${camp.id}/${crypto.randomUUID()}-${f.name}`;
      const { error } = await supabase.storage.from("camp-photos").upload(path, f);
      if (!error) added.push(path);
    }
    const next = [...photos, ...added];
    setPhotos(next);
    await updateCamp(camp.id, { photos: next });
    setUploading(false);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-semibold capitalize transition-colors",
                  status === s ? "bg-primary text-primary-contrast" : "bg-surface-2 text-muted",
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="turnout">Actual turnout</Label>
              <Input id="turnout" inputMode="numeric" value={turnout} onChange={(e) => setTurnout(e.target.value.replace(/\D/g, ""))} icon={<Users size={16} />} />
            </div>
            <div>
              <Label htmlFor="counter">{meta.counterLabel}</Label>
              <Input id="counter" inputMode="numeric" value={counter} onChange={(e) => setCounter(e.target.value.replace(/\D/g, ""))} />
            </div>
          </div>

          <Button onClick={save} disabled={busy} className="w-full">
            {saved ? <CheckCircle2 size={18} /> : null}
            {busy ? "Saving…" : saved ? "Saved" : "Save activity log"}
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Camera size={18} className="text-primary" /> Photos
          </div>
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p) => (
                <CampPhoto key={p} path={p} />
              ))}
            </div>
          )}
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && uploadPhotos(e.target.files)}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-foreground"
          />
          {uploading && (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Loader2 size={15} className="animate-spin" /> Uploading…
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Boxes size={18} className="text-primary" /> Stock / consumables
          </div>
          {stock.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-2">
                <span>Item</span><span className="w-20 text-center">Available</span><span className="w-20 text-center">Used</span>
              </div>
              {stock.map((r, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2">
                  <Input value={r.item} placeholder="e.g. Vaccine doses" onChange={(e) => setStock((p) => p.map((x, idx) => (idx === i ? { ...x, item: e.target.value } : x)))} />
                  <div className="w-20"><Input inputMode="numeric" value={r.available} onChange={(e) => setStock((p) => p.map((x, idx) => (idx === i ? { ...x, available: e.target.value.replace(/\D/g, "") } : x)))} /></div>
                  <div className="w-20"><Input inputMode="numeric" value={r.used} onChange={(e) => setStock((p) => p.map((x, idx) => (idx === i ? { ...x, used: e.target.value.replace(/\D/g, "") } : x)))} /></div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button onClick={() => setStock((p) => [...p, { item: "", available: "", used: "" }])} className="text-sm font-semibold text-primary">
              + Add item
            </button>
            {stock.length > 0 && (
              <Button size="sm" variant="outline" onClick={saveStock} disabled={stockBusy}>
                {stockBusy ? "Saving…" : "Save stock"}
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function CampPhoto({ path }: { path: string }) {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    const supabase = createClient();
    supabase.storage
      .from("camp-photos")
      .createSignedUrl(path, 3600)
      .then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [path]);
  return (
    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-surface-2">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Camp" className="h-full w-full object-cover" />
      ) : (
        <ImageIcon size={20} className="text-muted-2" />
      )}
    </div>
  );
}
