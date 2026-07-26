import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/stat-card";
import { SourceBadge, StatusBadge } from "@/components/status-badge";
import { villages, waterPoints } from "@/lib/demo-data";

export const Route = createFileRoute("/app/villages")({
  head: () => ({
    meta: [
      { title: "Villages & Habitations | AquaPulse" },
      {
        name: "description",
        content:
          "Village and habitation registry with population, water points and service coverage estimates.",
      },
      { property: "og:title", content: "Villages & Habitations | AquaPulse" },
      {
        property: "og:description",
        content: "Village registry with population, water points and coverage.",
      },
    ],
  }),
  component: VillagesPage,
});

function VillagesPage() {
  return (
    <>
      <PageHeader
        title="Villages & habitations"
        description="Administrative registry backing every water point, coverage figure and technician assignment."
        actions={<SourceBadge source="SIMULATED" />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {villages.map((v) => {
          const points = waterPoints.filter((w) => w.villageId === v.id);
          const served = points.reduce((s, p) => s + p.populationServed, 0);
          return (
            <section key={v.id} className="panel p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">{v.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {v.district} district · {v.population.toLocaleString("en-IN")} residents
                  </p>
                </div>
                <span className="numeric rounded-lg border border-border bg-surface px-2.5 py-1 text-xs">
                  {Math.min(100, Math.round((served / v.population) * 100))}% coverage
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {v.habitations.map((h) => (
                  <span
                    key={h}
                    className="rounded-md border border-border bg-surface px-2 py-0.5 text-xs"
                  >
                    {h}
                  </span>
                ))}
              </div>

              <ul className="mt-4 space-y-2">
                {points.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-2.5"
                  >
                    <span className="min-w-0 truncate text-sm">{p.name}</span>
                    <StatusBadge status={p.status} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
