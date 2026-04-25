import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Save } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Goal = Database["public"]["Enums"]["fitness_goal"];

const goalLabels: Record<Goal, string> = {
  lose_weight: "Lose Weight",
  build_strength: "Build Strength",
  stay_active: "Stay Active",
};

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }

export default function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<Goal>("stay_active");
  const [target, setTarget] = useState<number>(4);
  const [time, setTime] = useState("18:00");
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ workouts: 0, km: 0, streak: 0 });

  useEffect(() => { document.title = "Profile · FitTrack"; }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: ws }, { data: c }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("workout_sessions").select("id,logged_at"),
        supabase.from("cardio_sessions").select("distance_km,logged_at"),
      ]);
      if (p) {
        setName(p.full_name || "");
        if (p.goal) setGoal(p.goal);
        if (p.weekly_target) setTarget(p.weekly_target);
        if (p.reminder_time) setTime((p.reminder_time as string).slice(0, 5));
      }
      const totalKm = (c || []).reduce((a, b) => a + Number(b.distance_km || 0), 0);
      // longest streak across all logged days
      const days = new Set<string>();
      (ws || []).forEach((x: any) => days.add(startOfDay(new Date(x.logged_at)).toISOString()));
      (c || []).forEach((x: any) => days.add(startOfDay(new Date(x.logged_at)).toISOString()));
      const sorted = [...days].map((d) => new Date(d).getTime()).sort((a, b) => a - b);
      let longest = 0, cur = 0, prev = 0;
      sorted.forEach((t) => {
        if (cur === 0 || t - prev === 86400000) cur++;
        else cur = 1;
        prev = t;
        longest = Math.max(longest, cur);
      });
      setStats({ workouts: (ws || []).length, km: Math.round(totalKm * 10) / 10, streak: longest });
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: name.trim(),
      goal, weekly_target: target, reminder_time: time,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <div className="ft-card !p-3">
          <div className="ft-stat-label">Workouts</div>
          <div className="ft-stat-value">{stats.workouts}</div>
        </div>
        <div className="ft-card !p-3">
          <div className="ft-stat-label">Total km</div>
          <div className="ft-stat-value">{stats.km}</div>
        </div>
        <div className="ft-card !p-3">
          <div className="ft-stat-label">Best streak</div>
          <div className="ft-stat-value">{stats.streak}🔥</div>
        </div>
      </section>

      <section className="ft-card space-y-4">
        <div>
          <Label htmlFor="nm">Name</Label>
          <Input id="nm" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </div>
        <div>
          <Label>Goal</Label>
          <Select value={goal} onValueChange={(v) => setGoal(v as Goal)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(goalLabels) as Goal[]).map((g) => (
                <SelectItem key={g} value={g}>{goalLabels[g]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Weekly target</Label>
          <Select value={String(target)} onValueChange={(v) => setTarget(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[3, 4, 5, 6].map((n) => (<SelectItem key={n} value={String(n)}>{n} days</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="rt">Preferred workout time</Label>
          <Input id="rt" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <Button onClick={save} className="w-full" disabled={saving}>
          <Save className="h-4 w-4 mr-1" /> {saving ? "Saving…" : "Save changes"}
        </Button>
      </section>

      <Button variant="outline" className="w-full" onClick={signOut}>
        <LogOut className="h-4 w-4 mr-1" /> Sign out
      </Button>
    </div>
  );
}
