import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Home, HeartPulse, Dumbbell, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!data?.onboarded) navigate("/onboarding", { replace: true });
      setChecked(true);
    })();
  }, [user, loading, navigate]);

  if (loading || !user || !checked) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const tabs = [
    { to: "/", label: "Home", icon: Home, end: true },
    { to: "/cardio", label: "Cardio", icon: HeartPulse },
    { to: "/workout", label: "Workout", icon: Dumbbell },
    { to: "/profile", label: "Profile", icon: UserIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto">
      <main className="flex-1 pb-24 pt-4 px-4">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/90 backdrop-blur-md">
        <div className="max-w-md mx-auto grid grid-cols-4">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-3 text-xs ${isActive ? "text-primary" : "text-muted-foreground"}`
              }
            >
              {({ isActive }) => (
                <>
                  <t.icon className={`h-5 w-5 ${isActive ? "drop-shadow-[0_0_8px_hsl(var(--primary))]" : ""}`} />
                  <span>{t.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
