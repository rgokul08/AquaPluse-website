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

  const ringClass = {
    default: "bg-muted text-muted-foreground",
    healthy: "bg-healthy/12 text-healthy",
    warning: "bg-warning/15 text-warning",
    critical: "bg-critical/12 text-critical",
    primary: "bg-primary/12 text-primary",
  }[tone];

  return (
    <div className={cn("glass-card group p-4 sm:p-5", className)}>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium tracking-wide text-muted-foreground">{label}</p>
        {icon ? (
          <span className={cn("grid size-8 place-items-center rounded-lg", ringClass)}>{icon}</span>
        ) : null}
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
  eyebrow,
  actions,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1.5 font-display text-[26px] font-semibold leading-tight tracking-[-0.02em] sm:text-[34px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
