import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, MapPin, HeartPulse, Footprints, Bike, Activity } from "lucide-react";
import { toast } from "sonner";

type CardioType = "run" | "walk" | "cycle" | "other";
type Pt = { lat: number; lng: number; t: number };

const TYPES: { id: CardioType; label: string; icon: any; mets: number }[] = [
  { id: "run", label: "Run", icon: HeartPulse, mets: 9.8 },
  { id: "walk", label: "Walk", icon: Footprints, mets: 3.8 },
  { id: "cycle", label: "Cycle", icon: Bike, mets: 7.5 },
  { id: "other", label: "Other", icon: Activity, mets: 6 },
];

// Haversine distance in km
function haversine(a: Pt, b: Pt) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

const fmtTime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
};

const fmtPace = (km: number, sec: number) => {
  if (km < 0.01 || sec < 1) return "—";
  const paceSec = sec / km;
  const m = Math.floor(paceSec / 60);
  const s = Math.round(paceSec % 60);
  return `${m}:${String(s).padStart(2, "0")}/km`;
};

const fmtSpeed = (km: number, sec: number) => {
  if (sec < 1) return "—";
  return `${((km / sec) * 3600).toFixed(1)} km/h`;
};

export default function CardioTracker({ onSaved }: { onSaved?: () => void }) {
  const { user } = useAuth();
  const [type, setType] = useState<CardioType>("run");
  const [status, setStatus] = useState<"idle" | "running" | "paused">("idle");
  const [seconds, setSeconds] = useState(0);
  const [distance, setDistance] = useState(0); // km
  const [points, setPoints] = useState<Pt[]>([]);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const watchId = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const lastPt = useRef<Pt | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  // Timer tick
  useEffect(() => {
    if (status === "running") {
      tickRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [status]);

  const stopWatch = () => {
    if (watchId.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  };

  useEffect(() => () => stopWatch(), []);

  const startWatch = () => {
    if (!("geolocation" in navigator)) {
      toast.error("GPS not available on this device");
      return false;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setAccuracy(pos.coords.accuracy);
        if (statusRef.current !== "running") return;
        const pt: Pt = { lat: pos.coords.latitude, lng: pos.coords.longitude, t: Date.now() };
        // Filter low-accuracy fixes (>30m)
        if (pos.coords.accuracy > 30) {
          lastPt.current = pt;
          return;
        }
        if (lastPt.current) {
          const d = haversine(lastPt.current, pt);
          // Ignore tiny jitter (<5m) and absurd jumps (>200m/sec)
          const dt = (pt.t - lastPt.current.t) / 1000;
          if (d > 0.005 && d / Math.max(dt, 1) < 0.2) {
            setDistance((cur) => cur + d);
            setPoints((p) => [...p, pt]);
          }
        } else {
          setPoints((p) => [...p, pt]);
        }
        lastPt.current = pt;
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) toast.error("Location permission denied");
        else toast.error("GPS error: " + err.message);
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
    return true;
  };

  const handleStart = () => {
    if (status === "idle") {
      setSeconds(0);
      setDistance(0);
      setPoints([]);
      lastPt.current = null;
      if (!startWatch()) return;
    }
    setStatus("running");
  };

  const handlePause = () => {
    setStatus("paused");
    lastPt.current = null; // reset to avoid jump after pause
  };

  const calories = (() => {
    if (seconds <= 0) return 0;
    const met = TYPES.find((t) => t.id === type)!.mets;
    return Math.round((met * 70 * (seconds / 60)) / 60);
  })();

  const handleStop = async () => {
    if (!user) return;
    if (seconds < 5) {
      toast.error("Activity too short to save");
      reset();
      return;
    }
    setSaving(true);
    stopWatch();
    const { error } = await supabase.from("cardio_sessions").insert({
      user_id: user.id,
      type,
      duration_minutes: Math.max(1, Math.round(seconds / 60)),
      distance_km: Number(distance.toFixed(2)),
      calories,
      notes: `GPS tracked · ${points.length} points`,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Activity saved!");
    reset();
    onSaved?.();
  };

  const reset = () => {
    stopWatch();
    setStatus("idle");
    setSeconds(0);
    setDistance(0);
    setPoints([]);
    lastPt.current = null;
  };

  const ActiveIcon = TYPES.find((t) => t.id === type)!.icon;
  const isLive = status !== "idle";

  return (
    <div className="ft-card space-y-4 relative overflow-hidden">
      {/* Live pulse indicator */}
      {status === "running" && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Live</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
          <ActiveIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-bold leading-tight">Live Tracker</h2>
          <p className="text-[11px] text-muted-foreground">
            {accuracy !== null ? `GPS ±${Math.round(accuracy)}m` : "Tap start to acquire GPS"}
          </p>
        </div>
      </div>

      {/* Type selector — disabled while live */}
      <div className="grid grid-cols-4 gap-2">
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={isLive}
            onClick={() => setType(t.id)}
            className={`rounded-xl border py-2 flex flex-col items-center gap-1 text-[11px] transition ${
              type === t.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Big time display */}
      <div className="text-center py-2">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Duration</div>
        <div className="text-5xl font-bold tabular-nums tracking-tight text-primary">{fmtTime(seconds)}</div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-secondary/60 py-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Distance</div>
          <div className="text-xl font-bold tabular-nums">{distance.toFixed(2)}</div>
          <div className="text-[10px] text-muted-foreground">km</div>
        </div>
        <div className="rounded-xl bg-secondary/60 py-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {type === "cycle" ? "Speed" : "Pace"}
          </div>
          <div className="text-xl font-bold tabular-nums">
            {type === "cycle" ? fmtSpeed(distance, seconds) : fmtPace(distance, seconds)}
          </div>
          <div className="text-[10px] text-muted-foreground">{type === "cycle" ? "avg" : "avg"}</div>
        </div>
        <div className="rounded-xl bg-secondary/60 py-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Calories</div>
          <div className="text-xl font-bold tabular-nums">{calories}</div>
          <div className="text-[10px] text-muted-foreground">kcal</div>
        </div>
      </div>

      {/* GPS trail mini-viz */}
      {points.length > 1 && (
        <div className="rounded-xl border border-border bg-background/40 p-2 flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <div className="text-[11px] text-muted-foreground truncate">
            {points.length} GPS points tracked
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {status === "idle" && (
          <Button onClick={handleStart} className="w-full h-12 text-base font-semibold">
            <Play className="h-5 w-5 mr-1 fill-current" /> Start
          </Button>
        )}
        {status === "running" && (
          <>
            <Button onClick={handlePause} variant="outline" className="flex-1 h-12">
              <Pause className="h-5 w-5 mr-1" /> Pause
            </Button>
            <Button onClick={handleStop} variant="destructive" disabled={saving} className="flex-1 h-12">
              <Square className="h-4 w-4 mr-1 fill-current" /> {saving ? "Saving…" : "Finish"}
            </Button>
          </>
        )}
        {status === "paused" && (
          <>
            <Button onClick={handleStart} className="flex-1 h-12">
              <Play className="h-5 w-5 mr-1 fill-current" /> Resume
            </Button>
            <Button onClick={handleStop} variant="destructive" disabled={saving} className="flex-1 h-12">
              <Square className="h-4 w-4 mr-1 fill-current" /> {saving ? "Saving…" : "Finish"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
