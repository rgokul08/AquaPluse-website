import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageHeader, StatCard } from "@/components/stat-card";
import { SourceBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { alerts as seedAlerts, waterPointById, type Alert } from "@/lib/demo-data";

export const Route = createFileRoute("/_authenticated/app/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts | AquaPulse" },
      {
        name: "description",
        content:
          "Alert queue with severity, lifecycle state and acknowledge / resolve actions for field response.",
      },
      { property: "og:title", content: "Alerts | AquaPulse" },
      {
        property: "og:description",
        content: "Alert queue with severity, lifecycle and response actions.",
      },
    ],
  }),
  component: AlertsPage,
});

const severityTone: Record<Alert["severity"], string> = {
  critical: "border-critical/30 bg-critical/15 text-critical",
  high: "border-warning/35 bg-warning/20 text-warning",
  medium: "border-primary/30 bg-primary/10 text-primary",
  low: "border-border bg-muted text-muted-foreground",
};

const nextStatus: Record<Alert["status"], Alert["status"] | null> = {
  NEW: "ACKNOWLEDGED",
  ACKNOWLEDGED: "IN_PROGRESS",
  IN_PROGRESS: "RESOLVED",
  RESOLVED: "CLOSED",
  CLOSED: null,
};

function AlertsPage() {
  const [items, setItems] = useState<Alert[]>(seedAlerts);

  const advance = (id: string) => {
    setItems((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const next = nextStatus[a.status];
        if (!next) return a;
        toast.success(`Alert ${a.id} moved to ${next.replace("_", " ").toLowerCase()}`, {
          description: "Stored in this session only — persistence arrives with the cloud backend.",
        });
        return { ...a, status: next };
      }),
    );
  };

  const open = items.filter((a) => a.status !== "RESOLVED" && a.status !== "CLOSED");

  return (
    <>
      <PageHeader
        title="Alerts"
        description="Deduplicated alert queue produced by the rules engine. Actions update the live queue in this session."
        actions={<SourceBadge source="SIMULATED" />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open alerts" value={open.length} tone="critical" />
        <StatCard
          label="Critical"
          value={open.filter((a) => a.severity === "critical").length}
          tone="critical"
        />
        <StatCard label="Resolved / closed" value={items.length - open.length} tone="healthy" />
      </div>

      <ul className="space-y-3">
        {items.map((a) => {
          const wp = waterPointById(a.waterPointId);
          const next = nextStatus[a.status];
          return (
            <li
              key={a.id}
              className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${severityTone[a.severity]}`}
                  >
                    {a.severity}
                  </span>
                  <span className="font-medium">{a.category}</span>
                  <span className="numeric text-xs text-muted-foreground">{a.id}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {wp?.name} · raised {new Date(a.raisedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:shrink-0">
                <span className="rounded-md border border-border bg-surface px-2 py-1 text-xs">
                  {a.status.replace("_", " ")}
                </span>
                {next && (
                  <Button
                    size="sm"
                    variant={a.status === "NEW" ? "default" : "outline"}
                    onClick={() => advance(a.id)}
                  >
                    {a.status === "NEW"
                      ? "Acknowledge"
                      : a.status === "ACKNOWLEDGED"
                        ? "Start work"
                        : a.status === "IN_PROGRESS"
                          ? "Resolve"
                          : "Close"}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
