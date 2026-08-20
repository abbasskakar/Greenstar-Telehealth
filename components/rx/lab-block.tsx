"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Plus, X, Upload, FileText, Loader2 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { createClient } from "@/lib/supabase/client";
import { createLabRequest, addLabResult } from "@/app/rx/actions";

export type Lab = {
  id: string;
  tests: string[];
  notes: string | null;
  status: string;
  result_note: string | null;
  result_files: string[];
  doctor_name: string | null;
};

const COMMON_TESTS = ["CBC", "Blood Sugar", "Urine R/E", "LFT", "RFT", "ECG", "X-Ray Chest", "Ultrasound"];

export function LabBlock({
  appointmentId,
  labs,
  canRequest,
  canUpload,
}: {
  appointmentId: string;
  labs: Lab[];
  canRequest: boolean;
  canUpload: boolean;
}) {
  return (
    <div className="space-y-3">
      {labs.map((lab) => (
        <LabItem key={lab.id} lab={lab} appointmentId={appointmentId} canUpload={canUpload} />
      ))}
      {canRequest && <RequestForm appointmentId={appointmentId} />}
      {!labs.length && !canRequest && (
        <p className="text-sm text-muted">No lab requests for this appointment.</p>
      )}
    </div>
  );
}

function LabItem({
  lab,
  appointmentId,
  canUpload,
}: {
  lab: Lab;
  appointmentId: string;
  canUpload: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = React.useState("");
  const [files, setFiles] = React.useState<FileList | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function upload() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const paths: string[] = [];
    let failed = 0;
    if (files) {
      for (const f of Array.from(files)) {
        const path = `${appointmentId}/${crypto.randomUUID()}-${f.name}`;
        const { error } = await supabase.storage.from("lab-results").upload(path, f);
        if (error) failed++;
        else paths.push(path);
      }
    }
    // Nothing to save (all uploads failed and no note) — surface it, don't
    // silently mark the request "resulted".
    if (failed > 0 && paths.length === 0 && !note.trim()) {
      setBusy(false);
      setError("Upload failed — check the file(s) and try again.");
      return;
    }
    const res = await addLabResult(lab.id, appointmentId, note, paths);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Could not save the result.");
      return;
    }
    if (failed > 0) {
      setError(`Saved, but ${failed} file(s) failed to upload.`);
      return;
    }
    router.refresh();
  }

  const resulted = lab.status === "resulted";
  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-semibold text-foreground">
            <FlaskConical size={18} className="text-purple" /> Lab request
          </span>
          <StatusPill tone={resulted ? "success" : "warning"}>
            {resulted ? "Resulted" : "Requested"}
          </StatusPill>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {lab.tests.map((t) => (
            <span key={t} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-foreground">
              {t}
            </span>
          ))}
        </div>
        {lab.notes && <p className="text-sm text-muted">{lab.notes}</p>}

        {resulted && (
          <div className="space-y-2 rounded-lg bg-success-soft/50 p-3">
            {lab.result_note && <p className="text-sm text-foreground">{lab.result_note}</p>}
            {lab.result_files.map((p) => (
              <ResultFile key={p} path={p} />
            ))}
          </div>
        )}

        {!resulted && canUpload && (
          <div className="space-y-2 border-t border-border pt-3">
            <Label>Upload results</Label>
            <Input placeholder="Result summary (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={(e) => setFiles(e.target.files)}
              className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-foreground"
            />
            <Button size="sm" disabled={busy} onClick={upload}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {busy ? "Uploading…" : "Submit results"}
            </Button>
            {error && (
              <p className="rounded-lg bg-emergency-soft px-3 py-2 text-sm font-medium text-emergency">{error}</p>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function ResultFile({ path }: { path: string }) {
  const [url, setUrl] = React.useState<string | null>(null);
  async function open() {
    const supabase = createClient();
    const { data } = await supabase.storage.from("lab-results").createSignedUrl(path, 3600);
    if (data?.signedUrl) {
      setUrl(data.signedUrl);
      window.open(data.signedUrl, "_blank");
    }
  }
  const name = path.split("/").pop()?.replace(/^[0-9a-f-]+-/, "") ?? "result";
  return (
    <button onClick={open} className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
      <FileText size={15} /> {url ? "Opened" : name}
    </button>
  );
}

function RequestForm({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [tests, setTests] = React.useState<string[]>([]);
  const [input, setInput] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function add(t: string) {
    const v = t.trim();
    if (v && !tests.includes(v)) setTests((p) => [...p, v]);
    setInput("");
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await createLabRequest(appointmentId, tests, notes);
    setBusy(false);
    if (!res.ok) setError(res.error ?? "Could not save.");
    else {
      setOpen(false);
      setTests([]);
      setNotes("");
      router.refresh();
    }
  }

  if (!open) {
    return (
      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        <FlaskConical size={18} /> Request lab test
      </Button>
    );
  }

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-semibold text-foreground">
            <FlaskConical size={18} className="text-purple" /> Request lab test
          </span>
          <button onClick={() => setOpen(false)} className="text-muted-2 hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {tests.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tests.map((t) => (
              <span key={t} className="flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-strong">
                {t}
                <button onClick={() => setTests((p) => p.filter((x) => x !== t))}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Test name"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(input);
              }
            }}
          />
          <Button size="md" variant="secondary" onClick={() => add(input)}>
            <Plus size={16} />
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {COMMON_TESTS.filter((t) => !tests.includes(t)).map((t) => (
            <button
              key={t}
              onClick={() => add(t)}
              className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted hover:border-primary hover:text-primary"
            >
              + {t}
            </button>
          ))}
        </div>

        <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

        {error && (
          <p className="rounded-lg bg-emergency-soft px-3.5 py-2.5 text-sm font-medium text-emergency">{error}</p>
        )}
        <Button className="w-full" disabled={busy || !tests.length} onClick={submit}>
          {busy ? "Saving…" : "Send request"}
        </Button>
      </CardBody>
    </Card>
  );
}
