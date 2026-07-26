import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, AlertTriangle, Droplets, Gauge, Users, Wrench } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader, StatCard } from "@/components/stat-card";
import { SourceBadge, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  alerts,
  flowSeries,
  statusCounts,
  tickets,
  villages,
  waterPointById,
  waterPoints,
} from "@/lib/demo-data";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Operations Overview | AquaPulse" },
      {
        name: "description",
        content:
          "Live command centre for village water infrastructure: health, flow, alerts and maintenance at a glance.",
      },
      { property: "og:title", content: "Operations Overview | AquaPulse" },
      {
        property: "og:description",
        content:
          "Live command centre for village water infrastructure health, flow, alerts and maintenance.",
      },
    ],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  const total = waterPoints.length;
  const operational = statusCounts.HEALTHY + statusCounts.WARNING;
  const populationServed = waterPoints.reduce((s, w) => s + w.populationServed, 0);
  const openAlerts = alerts.filter((a) => a.status !== "RESOLVED" && a.status !== "CLOSED");
  const attention = waterPoints
    .filter((w) => w.status !== "HEALTHY")
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title="Operations overview"
        description={`${total} monitored water points across ${villages.length} villages. Every figure below is derived from the AquaPulse simulator.`}
        actions={
          <>
            <SourceBadge source="SIMULATED" />
            <Button asChild size="sm">
              <Link to="/app/alerts">Review alerts</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Operational rate"
          value={Math.round((operational / total) * 100)}
          unit="%"
          tone="healthy"
          icon={<Gauge className="size-4" />}
          hint={`${operational} of ${total} points delivering water`}
        />
        <StatCard
          label="Open alerts"
          value={openAlerts.length}
          tone="critical"
          icon={<AlertTriangle className="size-4" />}
          hint={`${openAlerts.filter((a) => a.severity === "critical").length} critical severity`}
        />
        <StatCard
          label="Open tickets"
          value={tickets.filter((t) => t.status !== "CLOSED").length}
          tone="warning"
          icon={<Wrench className="size-4" />}
          hint={`${tickets.filter((t) => t.autoCreated).length} auto-created by rules`}
        />
        <StatCard
          label="Population served"
          value={populationServed.toLocaleString("en-IN")}
          tone="primary"
          icon={<Users className="size-4" />}
          hint="Sum of per-point coverage estimates"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="panel p-4 sm:p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Network flow · last 24 hours</h2>
              <p className="text-xs text-muted-foreground">
                Average litres/minute and total village usage
              </p>
            </div>
            <SourceBadge source="SIMULATED" />
          </div>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={flowSeries} margin={{ left: -18, right: 6, top: 6 }}>
                <defs>
                  <linearGradient id="flowFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11 }}
                  stroke="var(--color-muted-foreground)"
                  interval={3}
                />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    color: "var(--color-popover-foreground)",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="flow"
                  name="Flow (L/min)"
                  stroke="var(--color-chart-1)"
                  fill="url(#flowFill)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="usage"
                  name="Usage (L)"
                  stroke="var(--color-chart-2)"
                  fill="transparent"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-4 sm:p-5">
          <h2 className="text-base font-semibold">Health distribution</h2>
          <p className="text-xs text-muted-foreground">
            Current classification of every water point
          </p>
          <ul className="mt-4 space-y-4">
            {(Object.keys(statusCounts) as Array<keyof typeof statusCounts>).map((status) => (
              <li key={status}>
                <div className="flex items-center justify-between gap-3">
                  <StatusBadge status={status} />
                  <span className="numeric text-sm font-medium">{statusCounts[status]}</span>
                </div>
                <Progress
                  value={(statusCounts[status] / waterPoints.length) * 100}
                  className="mt-2 h-1.5"
                />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
          <div>
            <h2 className="text-base font-semibold">Needs attention</h2>
            <p className="text-xs text-muted-foreground">
              Lowest health scores with engine explanations
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/app/water-points">All water points</Link>
          </Button>
        </div>
        <ul className="divide-y divide-border">
          {attention.map((wp) => (
            <li
              key={wp.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to="/app/water-points"
                    className="truncate font-medium hover:text-primary hover:underline"
                  >
                    {wp.name}
                  </Link>
                  <StatusBadge status={wp.status} />
                  <span className="numeric text-xs text-muted-foreground">{wp.code}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {wp.reasons.join(" · ")} — {wp.recommendedAction}
                </p>
              </div>
              <div className="flex items-center gap-4 sm:shrink-0">
                <div className="text-right">
                  <p className="numeric text-xl font-semibold">{wp.healthScore}</p>
                  <p className="text-[11px] text-muted-foreground">
                    health · {wp.confidence}% conf.
                  </p>
                </div>
                <Droplets aria-hidden className="size-5 text-muted-foreground" />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Activity aria-hidden className="size-4 text-primary" />
          <h2 className="text-base font-semibold">Latest alerts</h2>
        </div>
        <ul className="mt-3 space-y-2">
          {alerts.slice(0, 4).map((a) => {
            const wp = waterPointById(a.waterPointId);
            return (
              <li
                key={a.id}
                className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm">
                  <span className="font-medium">{a.category}</span>
                  <span className="text-muted-foreground"> — {a.message}</span>
                </span>
                <span className="text-xs text-muted-foreground">{wp?.name}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
