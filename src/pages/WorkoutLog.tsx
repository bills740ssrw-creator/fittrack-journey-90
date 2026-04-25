import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronDown, ChevronRight, Search } from "lucide-react";
import { toast } from "sonner";
import { EXERCISE_CATALOG } from "@/lib/exerciseCatalog";

type Exercise = { exercise_name: string; sets: string; reps: string; weight_kg: string };
type SessionRow = {
  id: string; session_name: string; logged_at: string;
  exercises: { id: string; exercise_name: string; sets: number; reps: number; weight_kg: number }[];
};

export default function WorkoutLog() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [exs, setExs] = useState<Exercise[]>([{ exercise_name: "", sets: "", reps: "", weight_kg: "" }]);
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const blurTimer = useRef<number | null>(null);

  useEffect(() => { document.title = "Workout Log · FitTrack"; }, []);

  const load = async () => {
    if (!user) return;
    const { data: ws } = await supabase.from("workout_sessions").select("*").order("logged_at", { ascending: false }).limit(30);
    const ids = (ws || []).map((s) => s.id);
    let exMap: Record<string, any[]> = {};
    if (ids.length) {
      const { data: ex } = await supabase.from("workout_exercises").select("*").in("session_id", ids).order("position");
      (ex || []).forEach((e: any) => { (exMap[e.session_id] ||= []).push(e); });
    }
    setRows((ws || []).map((s: any) => ({ ...s, exercises: exMap[s.id] || [] })));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const addRow = () => setExs((e) => [...e, { exercise_name: "", sets: "", reps: "", weight_kg: "" }]);
  const removeRow = (i: number) => setExs((e) => e.filter((_, idx) => idx !== i));
  const update = (i: number, k: keyof Exercise, v: string) => setExs((e) => e.map((x, idx) => idx === i ? { ...x, [k]: v } : x));

  // Build searchable name list: catalog ∪ user history (deduped, case-insensitive)
  const knownNames = useMemo(() => {
    const map = new Map<string, string>();
    EXERCISE_CATALOG.forEach((n) => map.set(n.toLowerCase(), n));
    rows.forEach((r) => r.exercises.forEach((e) => {
      const key = e.exercise_name.trim().toLowerCase();
      if (key && !map.has(key)) map.set(key, e.exercise_name.trim());
    }));
    return [...map.values()].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const getSuggestions = (q: string) => {
    const s = q.trim().toLowerCase();
    if (!s) return knownNames.slice(0, 6);
    const starts = knownNames.filter((n) => n.toLowerCase().startsWith(s));
    const contains = knownNames.filter((n) => !n.toLowerCase().startsWith(s) && n.toLowerCase().includes(s));
    return [...starts, ...contains].slice(0, 6);
  };

  const handleFocus = (i: number) => {
    if (blurTimer.current) { window.clearTimeout(blurTimer.current); blurTimer.current = null; }
    setFocusedIdx(i);
  };
  const handleBlur = () => {
    blurTimer.current = window.setTimeout(() => setFocusedIdx(null), 150);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) return toast.error("Name your session");
    const valid = exs.filter((x) => x.exercise_name.trim() && Number(x.sets) > 0 && Number(x.reps) > 0);
    if (valid.length === 0) return toast.error("Add at least one exercise");

    setSaving(true);
    const { data: s, error } = await supabase.from("workout_sessions").insert({ user_id: user.id, session_name: name.trim() }).select().single();
    if (error || !s) { setSaving(false); return toast.error(error?.message || "Failed"); }
    const payload = valid.map((x, i) => ({
      session_id: s.id,
      exercise_name: x.exercise_name.trim(),
      sets: Number(x.sets),
      reps: Number(x.reps),
      weight_kg: Number(x.weight_kg || 0),
      position: i,
    }));
    const { error: e2 } = await supabase.from("workout_exercises").insert(payload);
    setSaving(false);
    if (e2) return toast.error(e2.message);
    toast.success("Workout saved");
    setName(""); setExs([{ exercise_name: "", sets: "", reps: "", weight_kg: "" }]);
    load();
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("workout_sessions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Log workout</h1>
        <p className="text-sm text-muted-foreground">Build a session, add exercises, save.</p>
      </header>

      <form onSubmit={save} className="ft-card space-y-4">
        <div>
          <Label htmlFor="sname">Session name</Label>
          <Input id="sname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Push Day" maxLength={80} />
        </div>

        <div className="space-y-3">
          {exs.map((x, i) => (
            <div key={i} className="rounded-xl border border-border p-3 space-y-2 bg-background/40">
              <div className="flex items-start gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={x.exercise_name}
                    onChange={(e) => update(i, "exercise_name", e.target.value)}
                    onFocus={() => handleFocus(i)}
                    onBlur={handleBlur}
                    placeholder={`Search exercise ${i + 1}…`}
                    maxLength={80}
                    autoComplete="off"
                    className="pl-9"
                  />
                  {focusedIdx === i && (() => {
                    const sugg = getSuggestions(x.exercise_name);
                    if (sugg.length === 0) return null;
                    return (
                      <ul className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-auto rounded-lg border border-border bg-popover shadow-lg">
                        {sugg.map((s) => (
                          <li key={s}>
                            <button
                              type="button"
                              onMouseDown={(e) => { e.preventDefault(); update(i, "exercise_name", s); setFocusedIdx(null); }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                            >
                              {s}
                            </button>
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>
                {exs.length > 1 && (
                  <button type="button" onClick={() => removeRow(i)} className="text-muted-foreground hover:text-destructive p-2 mt-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Sets</Label>
                  <Input type="number" inputMode="numeric" min={1} value={x.sets} onChange={(e) => update(i, "sets", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Reps</Label>
                  <Input type="number" inputMode="numeric" min={1} value={x.reps} onChange={(e) => update(i, "reps", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">kg</Label>
                  <Input type="number" inputMode="decimal" min={0} step="0.5" value={x.weight_kg} onChange={(e) => update(i, "weight_kg", e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" className="w-full" onClick={addRow}>
            <Plus className="h-4 w-4 mr-1" /> Add exercise
          </Button>
        </div>

        <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving…" : "Save workout"}</Button>
      </form>

      <section>
        <h2 className="font-semibold mb-3">Past sessions</h2>
        {rows.length === 0 ? (
          <div className="ft-card text-center text-sm text-muted-foreground py-8">
            No workouts yet — build your first session above. 💪
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => {
              const isOpen = open[r.id];
              return (
                <li key={r.id} className="ft-card !p-0 overflow-hidden">
                  <button onClick={() => setOpen((o) => ({ ...o, [r.id]: !o[r.id] }))} className="w-full p-3 flex items-center gap-3 text-left">
                    {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <div className="flex-1">
                      <div className="font-medium">{r.session_name}</div>
                      <div className="text-xs text-muted-foreground">{new Date(r.logged_at).toLocaleString()} · {r.exercises.length} exercises</div>
                    </div>
                    <span onClick={(e) => { e.stopPropagation(); del(r.id); }} className="text-xs text-muted-foreground hover:text-destructive">Delete</span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-border px-4 py-3 space-y-1.5">
                      {r.exercises.map((e) => (
                        <div key={e.id} className="flex justify-between text-sm">
                          <span>{e.exercise_name}</span>
                          <span className="text-muted-foreground">{e.sets} × {e.reps} @ {Number(e.weight_kg)}kg</span>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
