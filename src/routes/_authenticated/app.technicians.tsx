import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/stat-card";
import { SourceBadge } from "@/components/status-badge";
import { Progress } from "@/components/ui/progress";
import { technicians, tickets, villageById } from "@/lib/demo-data";

export const Route = createFileRoute("/_authenticated/app/technicians")({
  head: () => ({
    meta: [
      { title: "Technicians | AquaPulse" },
      {
        name: "description",
        content:
          "Field technician roster with workload, skills, average repair time and completion rate.",
      },
      { property: "og:title", content: "Technicians | AquaPulse" },
      {
        property: "og:description",
        content: "Field technician roster with workload, skills and performance.",
      },
    ],
  }),
  component: TechniciansPage,
});

function TechniciansPage() {
  return (
    <>
      <PageHeader
        title="Technicians"
        description="Workload and performance for the field maintenance team, used by the assignment recommendations."
        actions={<SourceBadge source="SIMULATED" />}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {technicians.map((t) => {
          const assigned = tickets.filter((x) => x.technicianId === t.id);
          return (
            <section key={t.id} className="panel p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">{t.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {villageById(t.villageId)?.name} · {t.skills.join(", ")}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                    t.available
                      ? "border-healthy/30 bg-healthy/15 text-healthy"
                      : "border-offline/30 bg-offline/15 text-offline"
                  }`}
                >
                  {t.available ? "Available" : "Off duty"}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Open
                  </dt>
                  <dd className="numeric text-lg font-semibold">{t.openTickets}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Avg repair
                  </dt>
                  <dd className="numeric text-lg font-semibold">{t.avgRepairHours}h</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Completion
                  </dt>
                  <dd className="numeric text-lg font-semibold">{t.completionRate}%</dd>
                </div>
              </dl>

              <Progress value={t.completionRate} className="mt-3 h-1.5" />

              <p className="mt-3 text-xs text-muted-foreground">
                Currently holding {assigned.length} ticket{assigned.length === 1 ? "" : "s"} in this
                queue.
              </p>
            </section>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Roster records are simulated.{" "}
        <SourceBadge source="SIMULATED" className="ml-1 align-middle" />
      </p>
    </>
  );
}
