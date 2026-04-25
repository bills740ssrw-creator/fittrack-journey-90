import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { HeartPulse, Footprints, Bike, Activity } from "lucide-react";
import CardioTracker from "@/components/CardioTracker";

type CardioType = "run" | "walk" | "cycle" | "other";
type Row = { id: string; type: CardioType; duration_minutes: number; distance_km: number; calories: number; notes: string | null; logged_at: string };

const types: { id: CardioType; label: string; icon: any; mets: number }[] = [
  { id: "run", label: "Run", icon: HeartPulse, mets: 9.8 },
  { id: "walk", label: "Walk", icon: Footprints, mets: 3.8 },
  { id: "cycle", label: "Cycle", icon: Bike, mets: 7.5 },
  { id: "other", label: "Other", icon: Activity, mets: 6 },
];

export default function CardioLog() {
  const { user } = useAuth();
  const [type, setType] = useState<CardioType>("run");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { document.title = "Cardio Log · FitTrack"; }, []);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("cardio_sessions").select("*").order("logged_at", { ascending: false }).limit(50);
    setRows((data as Row[]) || []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const calories = useMemo(() => {
    const d = Number(duration);
    if (!d || d <= 0) return 0;
    const met = types.find((t) => t.id === type)!.mets;
    // Assume 70kg user for estimate
    return Math.round((met * 70 * d) / 60);
  }, [type, duration]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const d = Number(duration);
    const km = Number(distance || 0);
    if (!d || d <= 0) return toast.error("Enter a duration");
    if (km < 0) return toast.error("Distance must be ≥ 0");
    setSaving(true);
    const { error } = await supabase.from("cardio_sessions").insert({
      user_id: user.id,
      type,
      duration_minutes: d,
      distance_km: km,
      calories,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Cardio logged");
    setDuration(""); setDistance(""); setNotes("");
    load();
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("cardio_sessions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Log cardio</h1>
        <p className="text-sm text-muted-foreground">Track your runs, rides, and walks.</p>
      </header>

      <form onSubmit={save} className="ft-card space-y-4">
        <div>
          <Label>Type</Label>
          <div className="grid grid-cols-4 gap-2 mt-1.5">
            {types.map((t) => (
              <button key={t.id} type="button" onClick={() => setType(t.id)}
                className={`rounded-xl border py-2.5 flex flex-col items-center gap-1 text-xs transition ${type === t.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                <t.icon className="h-4 w-4" />{t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="dur">Duration (min)</Label>
            <Input id="dur" type="number" inputMode="numeric" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="30" />
          </div>
          <div>
            <Label htmlFor="dist">Distance (km)</Label>
            <Input id="dist" type="number" inputMode="decimal" min={0} step="0.01" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="5.0" />
          </div>
        </div>

        <div className="rounded-xl bg-secondary/60 px-3 py-2 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Estimated calories</span>
          <span className="text-lg font-semibold text-primary">{calories} kcal</span>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Felt great, easy pace…" maxLength={500} rows={2} />
        </div>

        <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving…" : "Log session"}</Button>
      </form>

      <section>
        <h2 className="font-semibold mb-3">Recent sessions</h2>
        {rows.length === 0 ? (
          <div className="ft-card text-center text-sm text-muted-foreground py-8">
            No cardio yet — log your first session above. 🏃
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => {
              const t = types.find((x) => x.id === r.type)!;
              return (
                <li key={r.id} className="ft-card !p-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-primary"><t.icon className="h-5 w-5" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium capitalize">{t.label} · {r.duration_minutes} min{r.distance_km ? ` · ${Number(r.distance_km)} km` : ""}</div>
                    <div className="text-xs text-muted-foreground">{new Date(r.logged_at).toLocaleString()} · {r.calories} kcal</div>
                  </div>
                  <button onClick={() => del(r.id)} className="text-xs text-muted-foreground hover:text-destructive">Delete</button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
