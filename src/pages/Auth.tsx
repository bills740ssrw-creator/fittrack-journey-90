import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { z } from "zod";

type Mode = "login" | "signup" | "forgot";

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(6, "Min 6 characters").max(72);

export default function Auth() {
  const [params] = useSearchParams();
  const initial = (params.get("mode") as Mode) || "login";
  const [mode, setMode] = useState<Mode>(initial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = mode === "signup" ? "Sign up · FitTrack" : mode === "forgot" ? "Reset password · FitTrack" : "Log in · FitTrack";
  }, [mode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/", { replace: true });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const e1 = emailSchema.safeParse(email);
      if (!e1.success) throw new Error(e1.error.issues[0].message);

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Check your inbox for a reset link");
        setMode("login");
        return;
      }

      const p1 = passwordSchema.safeParse(password);
      if (!p1.success) throw new Error(p1.error.issues[0].message);

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: name.trim() },
          },
        });
        if (error) throw error;
        toast.success("Account created — welcome!");
        navigate("/", { replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/`,
    });
    if (res.error) {
      toast.error(res.error.message || "Google sign-in failed");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8"><Logo size="lg" /></div>
        <div className="ft-card">
          <h1 className="text-xl font-semibold mb-1">
            {mode === "login" && "Welcome back"}
            {mode === "signup" && "Create your account"}
            {mode === "forgot" && "Reset your password"}
          </h1>
          <p className="text-sm text-muted-foreground mb-5">
            {mode === "login" && "Log in to keep your streak alive."}
            {mode === "signup" && "Set goals. Log workouts. See progress."}
            {mode === "forgot" && "We'll email you a reset link."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex" maxLength={80} />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
            </div>
            {mode !== "forgot" && (
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait…" : mode === "login" ? "Log in" : mode === "signup" ? "Create account" : "Send reset link"}
            </Button>
          </form>

          {mode !== "forgot" && (
            <>
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
                Continue with Google
              </Button>
            </>
          )}

          <div className="mt-5 text-center text-sm text-muted-foreground space-y-2">
            {mode === "login" && (
              <>
                <button type="button" className="text-primary hover:underline" onClick={() => setMode("forgot")}>Forgot password?</button>
                <p>No account? <button type="button" className="text-primary hover:underline" onClick={() => setMode("signup")}>Sign up</button></p>
              </>
            )}
            {mode === "signup" && (
              <p>Already have an account? <button type="button" className="text-primary hover:underline" onClick={() => setMode("login")}>Log in</button></p>
            )}
            {mode === "forgot" && (
              <p><button type="button" className="text-primary hover:underline" onClick={() => setMode("login")}>Back to log in</button></p>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/" className="hover:text-foreground">← Home</Link>
        </p>
      </div>
    </main>
  );
}
