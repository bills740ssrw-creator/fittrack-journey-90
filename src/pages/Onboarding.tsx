import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Dumbbell, HeartPulse } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Goal = Database["public"]["Enums"]["fitness_goal"];
type Sex = "male" | "female" | "other";
type ActivityLevel = "sedentary" | "light" | "moderate" | "very_active";

const goals: { id: Goal; label: string; desc: string; icon: any }[] = [
  { id: "lose_weight", label: "Lose Weight", desc: "Burn calories with cardio focus", icon: HeartPulse },
  { id: "build_strength", label: "Build Strength", desc: "Lift heavier, get stronger", icon: Dumbbell },
  { id: "stay_active", label: "Stay Active", desc: "Stay consistent, feel great", icon: Activity },
];

const targets = [3, 4, 5, 6];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [time, setTime] = useState("18:00");
  // Body measurements
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex | "">("");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { document.title = "Welcome · FitTrack"; }, []);

  const measuresValid =
    Number(height) >= 80 && Number(height) <= 250 &&
    Number(weight) >= 25 && Number(weight) <= 350 &&
    Number(age) >= 10 && Number(age) <= 100 &&
    !!sex;

  const finish = async () => {
    if (!goal || !target || !measuresValid) return;
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return; }
    const { error } = await supabase
      .from("profiles")
      .update({
        goal,
        weekly_target: target,
        reminder_time: time,
        onboarded: true,
        height_cm: Number(height),
        weight_kg: Number(weight),
        age: Number(age),
        sex: sex as Sex,
        activity_level: activity,
      })
      .eq("user_id", u.user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("You're all set!");
    navigate("/", { replace: true });
  };

  return (
    <main className="min-h-screen px-5 py-10 flex flex-col">
      <div className="flex justify-center mb-8"><Logo size="lg" /></div>
      <div className="max-w-sm w-full mx-auto flex-1">
        <div className="flex gap-1.5 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>

        {step === 1 && (
          <section>
            <h1 className="text-2xl font-bold mb-1">What's your goal?</h1>
            <p className="text-muted-foreground mb-5">We'll tailor suggestions to fit it.</p>
            <div className="space-y-3">
              {goals.map((g) => (
                <button key={g.id} onClick={() => setGoal(g.id)}
                  className={`w-full text-left ft-card flex items-center gap-3 transition ${goal === g.id ? "border-primary ft-glow" : "hover:border-primary/50"}`}>
                  <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-primary"><g.icon className="h-5 w-5" /></div>
                  <div>
                    <div className="font-semibold">{g.label}</div>
                    <div className="text-xs text-muted-foreground">{g.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <Button className="w-full mt-6" disabled={!goal} onClick={() => setStep(2)}>Continue</Button>
          </section>
        )}

        {step === 2 && (
          <section>
            <h1 className="text-2xl font-bold mb-1">Weekly target</h1>
            <p className="text-muted-foreground mb-5">How many days per week?</p>
            <div className="grid grid-cols-2 gap-3">
              {targets.map((t) => (
                <button key={t} onClick={() => setTarget(t)}
                  className={`ft-card text-center py-6 transition ${target === t ? "border-primary ft-glow" : "hover:border-primary/50"}`}>
                  <div className="text-3xl font-bold">{t}</div>
                  <div className="text-xs text-muted-foreground mt-1">days / week</div>
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" disabled={!target} onClick={() => setStep(3)}>Continue</Button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <h1 className="text-2xl font-bold mb-1">Preferred workout time</h1>
            <p className="text-muted-foreground mb-5">When do you usually train?</p>
            <div className="ft-card">
              <Label htmlFor="time">Time of day</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
              <Button className="flex-1" disabled={saving} onClick={finish}>{saving ? "Saving…" : "Start training"}</Button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
