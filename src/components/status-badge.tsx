import { cn } from "@/lib/utils";
import type { DataSource, HealthStatus } from "@/lib/demo-data";
import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  FlaskConical,
  OctagonX,
  WifiOff,
} from "lucide-react";

const map: Record<HealthStatus, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  HEALTHY: {
    label: "Healthy",
    className: "bg-healthy/15 text-healthy border-healthy/30",
    Icon: CheckCircle2,
  },
  WARNING: {
    label: "Warning",
    className: "bg-warning/20 text-warning border-warning/35",
    Icon: AlertTriangle,
  },
  CRITICAL: {
    label: "Critical",
    className: "bg-critical/15 text-critical border-critical/30",
    Icon: OctagonX,
  },
  FAILED: {
    label: "Failed",
    className: "bg-failed/15 text-failed border-failed/30",
    Icon: CircleSlash,
  },
  OFFLINE: {
    label: "Offline",
    className: "bg-offline/15 text-offline border-offline/30",
    Icon: WifiOff,
  },
};

export function StatusBadge({ status, className }: { status: HealthStatus; className?: string }) {
  const { label, className: tone, Icon } = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tone,
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {label}
    </span>
  );
}

const sourceLabels: Record<DataSource, string> = {
  REAL_SENSOR: "Real sensor",
  SIMULATED: "Simulated",
  MANUAL: "Manual entry",
  EXTERNAL: "External data",
};

export function SourceBadge({ source, className }: { source: DataSource; className?: string }) {
  const isSim = source === "SIMULATED";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        isSim
          ? "border-simulated/35 bg-simulated/15 text-simulated"
          : "border-border bg-muted text-muted-foreground",
        className,
      )}
      title={
        isSim ? "This value comes from the AquaPulse simulator, not a physical device." : undefined
      }
    >
      <FlaskConical aria-hidden className="size-3" />
      {sourceLabels[source]}
    </span>
  );
}
