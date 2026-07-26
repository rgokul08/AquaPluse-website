import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageHeader, StatCard } from "@/components/stat-card";
import { SourceBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  technicianById,
  technicians,
  tickets as seedTickets,
  waterPointById,
  type Ticket,
} from "@/lib/demo-data";

export const Route = createFileRoute("/app/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance | AquaPulse" },
      {
        name: "description",
        content:
          "Maintenance tickets with SLA, priority, technician assignment and lifecycle progression.",
      },
      { property: "og:title", content: "Maintenance | AquaPulse" },
      {
        property: "og:description",
        content: "Maintenance tickets with SLA, priority and technician assignment.",
      },
    ],
  }),
  component: MaintenancePage,
});

const flow: Record<Ticket["status"], Ticket["status"] | null> = {
  OPEN: "ASSIGNED",
  ASSIGNED: "IN_PROGRESS",
  IN_PROGRESS: "VERIFYING",
  VERIFYING: "CLOSED",
  CLOSED: null,
};

function MaintenancePage() {
  const [items, setItems] = useState<Ticket[]>(seedTickets);

  const assign = (id: string, technicianId: string) => {
    setItems((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, technicianId, status: t.status === "OPEN" ? "ASSIGNED" : t.status }
          : t,
      ),
    );
    toast.success(`${id} assigned to ${technicianById(technicianId)?.name}`, {
      description: "Session-only change until the cloud backend is connected.",
    });
  };

  const advance = (id: string) => {
    setItems((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = flow[t.status];
        if (!next) return t;
        toast.success(`${id} → ${next.replace("_", " ").toLowerCase()}`);
        return { ...t, status: next };
      }),
    );
  };

  const openCount = items.filter((t) => t.status !== "CLOSED").length;

  return (
    <>
      <PageHeader
        title="Maintenance"
        description="Tickets raised automatically by the automation rules, plus manually created work."
        actions={<SourceBadge source="SIMULATED" />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open tickets" value={openCount} tone="warning" />
        <StatCard
          label="P1 priority"
          value={items.filter((t) => t.priority === "P1").length}
          tone="critical"
        />
        <StatCard
          label="Auto-created"
          value={items.filter((t) => t.autoCreated).length}
          tone="primary"
        />
      </div>

      <ul className="space-y-3">
        {items.map((t) => {
          const next = flow[t.status];
          return (
            <li key={t.id} className="panel p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="numeric rounded-md border border-border bg-surface px-2 py-0.5 text-xs">
                      {t.id}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                        t.priority === "P1"
                          ? "border-critical/30 bg-critical/15 text-critical"
                          : t.priority === "P2"
                            ? "border-warning/35 bg-warning/20 text-warning"
                            : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      {t.priority}
                    </span>
                    <span className="font-medium">{t.title}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {waterPointById(t.waterPointId)?.name} · SLA {t.slaHours}h · created{" "}
                    {new Date(t.createdAt).toLocaleString()}{" "}
                    {t.autoCreated ? "· auto-created by rule" : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                  <Select value={t.technicianId ?? ""} onValueChange={(v) => assign(t.id, v)}>
                    <SelectTrigger className="w-48" aria-label={`Assign technician for ${t.id}`}>
                      <SelectValue placeholder="Assign technician" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.name} · {tech.openTickets} open
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="rounded-md border border-border bg-surface px-2 py-1 text-xs">
                    {t.status.replace("_", " ")}
                  </span>
                  {next && (
                    <Button size="sm" variant="outline" onClick={() => advance(t.id)}>
                      Move to {next.replace("_", " ").toLowerCase()}
                    </Button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
