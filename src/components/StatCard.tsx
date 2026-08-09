import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: "up" | "down" | "neutral";
  icon?: ReactNode;
};

export function StatCard({ label, value, hint, trend, icon }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_1px_0_rgba(11,110,79,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <div className="mt-2 font-display text-2xl font-semibold text-charcoal">
            {value}
          </div>
          {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
        </div>
        {icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-forest">
            {icon}
          </div>
        ) : null}
      </div>
      {trend && trend !== "neutral" ? (
        <div
          className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${
            trend === "up" ? "text-forest" : "text-danger"
          }`}
        >
          {trend === "up" ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {trend === "up" ? "Up" : "Down"} vs prior
        </div>
      ) : null}
    </div>
  );
}
