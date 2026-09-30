"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress, ProgressValue } from "@/components/ui/progress";
import { Download, Loader2, SquareTerminal, Play, Square } from "lucide-react";

type ProgressInfo = {
  target?: number;
  attempted?: number;
  of?: number;
  ok?: number;
  failed?: number;
  elapsedSec?: number;
  ratePerSec?: number;
  last?: string;
  at?: string;
};

type Status = {
  running: boolean;
  pid: number | null;
  startedAt: string | null;
  args: string[];
  progress: ProgressInfo | null;
  finishedSecAgo: number | null;
  log: string;
  hasReport: boolean;
  script: string;
};

const EMPTY: Status = {
  running: false,
  pid: null,
  startedAt: null,
  args: [],
  progress: null,
  finishedSecAgo: null,
  log: "",
  hasReport: false,
  script: "",
};

export function ImportLibraryButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const [target, setTarget] = useState("599");
  const [sources, setSources] = useState("ziyouz,handybook");
  const [order, setOrder] = useState("size");
  const [resume, setResume] = useState(true);

  const wasRunning = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const s = await api.get<Status>("/api/manager/books/import");
      setStatus(s);
      setLoaded(true);
      if (wasRunning.current && !s.running) {
        toast.success("Import yakunlandi", {
          description: `${s.progress?.ok ?? 0} ta kitob qo'shildi`,
        });
        router.refresh();
      }
      wasRunning.current = s.running;
    } catch {
      /* network xatosi — keyingi pollingda qayta urinamiz */
    }
  }, [router]);

  // Mountda bir marta + holat o'zgarganda polling
  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!open && !status.running) return;
    const t = setInterval(() => void refresh(), 1500);
    return () => clearInterval(t);
  }, [open, status.running, refresh]);

  async function start() {
    setBusy(true);
    try {
      const n = Math.floor(Number(target));
      await api.post("/api/manager/books/import", {
        action: "start",
        target: Number.isFinite(n) && n > 0 ? n : undefined,
        sources,
        order,
        resume,
      });
      await refresh();
      wasRunning.current = true;
      toast.success("Import boshlandi");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Boshlab bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  async function stop() {
    setBusy(true);
    try {
      await api.post("/api/manager/books/import", { action: "stop" });
      await refresh();
      toast.info("Import to'xtatildi");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "To'xtatib bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  const p = status.progress;
  const done = p?.attempted ?? 0;
  const total = p?.of ?? p?.target ?? 0;
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

  return (
    <>
      <Button
        variant={status.running ? "default" : "outline"}
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        {status.running ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
        Import
        {status.running && (
          <Badge variant="secondary" className="ml-1 tabular-nums">
            {pct}%
          </Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SquareTerminal size={18} /> Kutubxonani import qilish
            </DialogTitle>
            <DialogDescription>
              {loaded ? (
                <>
                  Skript: <code className="text-xs">{status.script}</code>
                </>
              ) : (
                "Yuklanmoqda..."
              )}
            </DialogDescription>
          </DialogHeader>

          {status.running ? (
            /* ── Jonli holat ─────────────────────────────── */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Loader2 size={14} className="animate-spin" />
                  Import ketmoqda
                  {status.pid ? (
                    <span className="text-muted-foreground font-normal">
                      · pid {status.pid}
                    </span>
                  ) : null}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {done} / {total || "?"}
                </span>
              </div>

              <Progress value={pct}>
                <ProgressValue>{() => `${pct}%`}</ProgressValue>
              </Progress>

              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Stat label="Muvaffaqiyatli" value={p?.ok ?? 0} tone="ok" />
                <Stat label="Xato" value={p?.failed ?? 0} tone="fail" />
                <Stat label="Tezlik" value={p?.ratePerSec ? `${p.ratePerSec}/s` : "—"} />
                <Stat
                  label="O'tdi"
                  value={
                    p?.elapsedSec
                      ? `${Math.floor(p.elapsedSec / 60)}m ${p.elapsedSec % 60}s`
                      : "—"
                  }
                />
              </div>

              {p?.last ? (
                <p className="truncate text-xs text-muted-foreground">
                  Oxirgi: {p.last}
                </p>
              ) : null}

              <LogView log={status.log} open={showLog} onToggle={() => setShowLog((v) => !v)} />
            </div>
          ) : (
            /* ── Sozlamalar ─────────────────────────────── */
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="imp-target">Maqsad (soni)</Label>
                  <Input
                    id="imp-target"
                    type="number"
                    min={1}
                    max={2000}
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Manba</Label>
                  <Select value={sources} onValueChange={(v) => setSources(v ?? sources)}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ziyouz,handybook">Ikkalasi</SelectItem>
                      <SelectItem value="ziyouz">Faqat ziyouz.com</SelectItem>
                      <SelectItem value="handybook">Faqat handybook.uz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Saralash</Label>
                  <Select value={order} onValueChange={(v) => setOrder(v ?? order)}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="size">Kichik fayllar avval</SelectItem>
                      <SelectItem value="score">Sifat bo'yicha</SelectItem>
                      <SelectItem value="id">Tartib bo'yicha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Rejim</Label>
                  <Button
                    type="button"
                    variant={resume ? "default" : "outline"}
                    className="h-10 w-full"
                    onClick={() => setResume((v) => !v)}
                  >
                    {resume ? "Davom ettirish (resume)" : "Boshidan"}
                  </Button>
                </div>
              </div>

              {status.progress ? (
                <p className="text-xs text-muted-foreground">
                  Oxirgi ishda: {status.progress.ok ?? 0} ta yuklandi ·{" "}
                  {status.progress.at ? new Date(status.progress.at).toLocaleString() : ""}
                </p>
              ) : null}

              <LogView log={status.log} open={showLog} onToggle={() => setShowLog((v) => !v)} />
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="ghost" size="sm" onClick={() => setShowLog((v) => !v)}>
              {showLog ? "Logni yashirish" : "Logni ko'rsatish"}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Yopish
              </Button>
              {status.running ? (
                <Button variant="destructive" disabled={busy} onClick={stop}>
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Square size={16} />}
                  To'xtatish
                </Button>
              ) : (
                <Button disabled={busy} onClick={start}>
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                  Boshlash
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "ok" | "fail";
}) {
  return (
    <div className="rounded-md border bg-muted/40 p-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div
        className={`font-semibold tabular-nums ${
          tone === "ok" ? "text-emerald-600" : tone === "fail" ? "text-destructive" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function LogView({
  log,
  open,
  onToggle,
}: {
  log: string;
  open: boolean;
  onToggle: () => void;
}) {
  const lines = log.split(/\r?\n/).filter(Boolean);
  const tail = lines.slice(-40).join("\n");

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onToggle}
        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
      >
        {open ? "Logni yashirish" : `Logni ko'rsatish (${lines.length} qator)`}
      </button>
      {open && (
        <pre className="max-h-56 overflow-auto rounded-md border bg-background p-3 text-[11px] leading-relaxed">
          {tail || "(log bo'sh)"}
        </pre>
      )}
    </div>
  );
}
