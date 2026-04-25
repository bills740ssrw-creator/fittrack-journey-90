import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Flame, Activity, Dumbbell, Timer, Sparkles } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

type Cardio = { id: string; type: string; duration_minutes: number; distance_km: number; calories: number; logged_at: string };
type WS = { id: string; logged_at: string };
type WE = { id: string; session_id: string; exercise_name: string; sets: number; reps: number; weight_kg: number };

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function startOfWeek(d: Date) {
  const x = startOfDay(d); const day = (x.getDay() + 6) % 7; // Mon=0
  x.setDate(x.getDate() - day); return x;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [cardio, setCardio] = useState<Cardio[]>([]);
  const [sessions, setSessions] = useState<WS[]>([]);
  const [exercises, setExercises] = useState<WE[]>([]);

  useEffect(() => { document.title = "Dashboard · FitTrack"; }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const since = new Date(); since.setDate(since.getDate() - 90);
      const [{ data: p }, { data: c }, { data: s }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("cardio_sessions").select("*").gte("logged_at", since.toISOString()).order("logged_at", { ascending: false }),
        supabase.from("workout_sessions").select("id,logged_at").gte("logged_at", since.toISOString()).order("logged_at", { ascending: false }),
      ]);
      setProfile(p); setCardio(c || []); setSessions(s || []);
      const ids = (s || []).map((x) => x.id);
      if (ids.length) {
        const { data: ex } = await supabase.from("workout_exercises").select("*").in("session_id", ids);
        setExercises(ex || []);
      }
    })();
  }, [user]);

  const today = startOfDay(new Date());
  const weekStart = startOfWeek(new Date());

  const todayCardio = cardio.filter((c) => new Date(c.logged_at) >= today);
  const todaySessions = sessions.filter((s) => new Date(s.logged_at) >= today);
  const todayCals = todayCardio.reduce((a, b) => a + b.calories, 0);
  const todayMins = todayCardio.reduce((a, b) => a + b.duration_minutes, 0);
  const todayLogs = todayCardio.length + todaySessions.length;

  // Active days this week (any cardio or workout)
  const activeDays = useMemo(() => {
    const set = new Set<string>();
    [...cardio, ...sessions].forEach((x) => {
      const d = new Date(x.logged_at);
      if (d >= weekStart) set.add(startOfDay(d).toISOString());
    });
    return set.size;
  }, [cardio, sessions, weekStart]);

  // Streak: consecutive days with at least one log, ending today or yesterday
  const streak = useMemo(() => {
    const days = new Set<string>();
    [...cardio, ...sessions].forEach((x) => days.add(startOfDay(new Date(x.logged_at)).toISOString()));
    let s = 0;
    const cursor = new Date(today);
    if (!days.has(cursor.toISOString())) cursor.setDate(cursor.getDate() - 1);
    while (days.has(cursor.toISOString())) { s++; cursor.setDate(cursor.getDate() - 1); }
    return s;
  }, [cardio, sessions, today]);

  // Cardio per week (last 8 weeks)
  const cardioChart = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (let i = 7; i >= 0; i--) {
      const wk = startOfWeek(new Date()); wk.setDate(wk.getDate() - i * 7);
      buckets[wk.toISOString()] = 0;
    }
    cardio.forEach((c) => {
      const wk = startOfWeek(new Date(c.logged_at)).toISOString();
      if (wk in buckets) buckets[wk] += 1;
    });
    return Object.entries(buckets).map(([k, v]) => ({ week: new Date(k).toLocaleDateString(undefined, { month: "short", day: "numeric" }), sessions: v }));
  }, [cardio]);

  // Volume trend (sets*reps*weight per session, last 12)
  const volumeChart = useMemo(() => {
    const sMap = new Map(sessions.map((s) => [s.id, s.logged_at]));
    const vols: { date: string; volume: number; t: number }[] = [];
    sessions.forEach((s) => {
      const v = exercises.filter((e) => e.session_id === s.id).reduce((a, e) => a + e.sets * e.reps * Number(e.weight_kg || 0), 0);
      vols.push({ date: new Date(s.logged_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }), volume: Math.round(v), t: new Date(s.logged_at).getTime() });
    });
    return vols.sort((a, b) => a.t - b.t).slice(-12);
  }, [sessions, exercises]);

  // Smart suggestions
  const suggestions = useMemo(() => {
    const out: string[] = [];
    const cardioThisWeek = cardio.filter((c) => new Date(c.logged_at) >= weekStart).length;
    if (cardioThisWeek < 2) out.push("Add one more cardio session this week to stay on track.");

    const lastLog = [...cardio, ...sessions].map((x) => new Date(x.logged_at).getTime()).sort((a, b) => b - a)[0];
    if (!lastLog || (Date.now() - lastLog) / 86400000 >= 3) out.push("You're breaking your streak — log a quick session today. 🔥");

    // Progressive overload: same weight on same exercise for 2+ weeks
    const byEx: Record<string, { date: number; weight: number }[]> = {};
    exercises.forEach((e) => {
      const at = new Date((sessions.find((s) => s.id === e.session_id)?.logged_at) || 0).getTime();
      const key = e.exercise_name.trim().toLowerCase();
      (byEx[key] ||= []).push({ date: at, weight: Number(e.weight_kg || 0) });
    });
    for (const [name, arr] of Object.entries(byEx)) {
      arr.sort((a, b) => a.date - b.date);
      if (arr.length >= 2) {
        const last = arr[arr.length - 1], first = arr[0];
        if (last.weight === first.weight && (last.date - first.date) >= 14 * 86400000) {
          out.push(`Try progressive overload on ${name} — same weight for 2+ weeks.`);
          break;
        }
      }
    }
    return out.slice(0, 3);
  }, [cardio, sessions, exercises, weekStart]);

  const target = profile?.weekly_target ?? 4;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</p>
          <h1 className="text-2xl font-bold tracking-tight">Hey{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋</h1>
        </div>
        <div className="ft-card !p-3 flex items-center gap-2">
          <Flame className="h-5 w-5 text-warning" />
          <div>
            <div className="ft-stat-value leading-none">{streak}</div>
            <div className="ft-stat-label">streak</div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <Stat icon={<Activity className="h-4 w-4" />} label="Calories" value={todayCals.toString()} />
        <Stat icon={<Timer className="h-4 w-4" />} label="Active min" value={todayMins.toString()} />
        <Stat icon={<Dumbbell className="h-4 w-4" />} label="Sessions" value={todayLogs.toString()} />
      </section>

      <section className="ft-card">
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="ft-stat-label">This week</div>
            <div className="text-xl font-semibold">{activeDays}/{target} days active</div>
          </div>
          <div className="text-sm text-muted-foreground">{Math.min(100, Math.round((activeDays / target) * 100))}%</div>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-gradient-primary transition-all" style={{ width: `${Math.min(100, (activeDays / target) * 100)}%` }} />
        </div>
      </section>

      {suggestions.length > 0 && (
        <section className="ft-card">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Smart suggestions</h2>
          </div>
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li key={i} className="text-sm text-foreground/90 border-l-2 border-primary pl-3">{s}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="ft-card">
        <h2 className="font-semibold mb-3">Cardio consistency</h2>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cardioChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="ft-card">
        <h2 className="font-semibold mb-3">Volume trend</h2>
        {volumeChart.length === 0 ? (
          <p className="text-sm text-muted-foreground">Log a workout to see your volume.</p>
        ) : (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="volume" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="ft-card !p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">{icon}<span className="ft-stat-label">{label}</span></div>
      <div className="ft-stat-value mt-1">{value}</div>
    </div>
  );
}
