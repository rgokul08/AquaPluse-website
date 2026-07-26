import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  unit,
  hint,
  icon,
  tone = "default",
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "healthy" | "warning" | "critical" | "primary";
  className?: string;
}) {
  const toneClass = {
    default: "text-foreground",
    healthy: "text-healthy",
    warning: "text-warning",
    critical: "text-critical",
    primary: "text-primary",
  }[tone];

  return (
    <div className={cn("panel p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>
      <p className={cn("numeric mt-3 text-3xl font-semibold tracking-tight", toneClass)}>
        {value}
        {unit ? (
          <span className="ml-1 text-base font-normal text-muted-foreground">{unit}</span>
        ) : null}
      </p>
      {hint ? <div className="mt-2 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
