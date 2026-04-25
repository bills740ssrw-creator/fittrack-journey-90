import { Flame } from "lucide-react";

export const Logo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const px = size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-xl";
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary ft-glow">
        <Flame className="h-5 w-5 text-primary-foreground" />
      </div>
      <span className={`${px} font-bold tracking-tight`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        FitTrack
      </span>
    </div>
  );
};
