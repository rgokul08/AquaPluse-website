import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, AlertTriangle, Droplets, Gauge, Users, Wrench } from "lucide-react";
import {
  Area,
  Cell,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader, StatCard } from "@/components/stat-card";
import { SourceBadge, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  alerts,
  flowSeries,
  statusCounts,
  tickets,
  villages,
  waterPointById,
  waterPoints,
} from "@/lib/demo-data";

const statusColor: Record<string, string> = {
  HEALTHY: "var(--color-healthy)",
  WARNING: "var(--color-warning)",
  CRITICAL: "var(--color-critical)",
  FAILED: "var(--color-failed)",
  OFFLINE: "var(--color-offline)",
};


export const Route = createFileRoute("/_authenticated/app/")({
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
  const donutData = (Object.keys(statusCounts) as Array<keyof typeof statusCounts>)
    .map((name) => ({ name, value: statusCounts[name] }))
    .filter((d) => d.value > 0);


  return (
    <>
      <PageHeader
        eyebrow="Control room"
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
        <section className="glass-panel p-4 sm:p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold tracking-tight">
                Network flow · last 24 hours
              </h2>
              <p className="text-xs text-muted-foreground">
                Flow rate (L/min, left axis) against total village usage (L, right axis)
              </p>
            </div>
            <SourceBadge source="SIMULATED" />
          </div>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={flowSeries} margin={{ left: -14, right: -6, top: 6 }}>
                <defs>
                  <linearGradient id="flowFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                    <stop offset="60%" stopColor="var(--color-chart-1)" stopOpacity={0.14} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
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
                  tickLine={false}
                  axisLine={false}
                  interval={3}
                />
                <YAxis
                  yAxisId="flow"
                  tick={{ fontSize: 11 }}
                  stroke="var(--color-chart-1)"
                  tickLine={false}
                  axisLine={false}
                  domain={["dataMin - 5", "dataMax + 5"]}
                  width={54}
                />
                <YAxis
                  yAxisId="usage"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  stroke="var(--color-chart-2)"
                  tickLine={false}
                  axisLine={false}
                  domain={["dataMin - 50", "dataMax + 50"]}
                  width={58}
                />
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
                  yAxisId="flow"
                  type="monotone"
                  dataKey="flow"
                  name="Flow (L/min)"
                  stroke="var(--color-chart-1)"
                  fill="url(#flowFill)"
                  strokeWidth={2.25}
                  activeDot={{ r: 4 }}
                />
                <Line
                  yAxisId="usage"
                  type="monotone"
                  dataKey="usage"
                  name="Usage (L)"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass-panel p-4 sm:p-5">
          <h2 className="font-display text-base font-semibold tracking-tight">
            Health distribution
          </h2>
          <p className="text-xs text-muted-foreground">
            Current classification of every water point
          </p>
          <div className="relative mt-2 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="66%"
                  outerRadius="94%"
                  paddingAngle={3}
                  stroke="var(--color-card)"
                  strokeWidth={2}
                >
                  {donutData.map((d) => (
                    <Cell key={d.name} fill={statusColor[d.name]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    color: "var(--color-popover-foreground)",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="numeric text-2xl font-semibold leading-none">{total}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">water points</p>
              </div>
            </div>
          </div>
          <ul className="mt-3 grid grid-cols-1 gap-1.5">
            {donutData.map((d) => (
              <li
                key={d.name}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-surface/60 px-2.5 py-1.5"
              >
                <StatusBadge status={d.name as keyof typeof statusCounts} />
                <span className="flex items-baseline gap-1.5">
                  <span className="numeric text-sm font-semibold">{d.value}</span>
                  <span className="numeric text-[11px] text-muted-foreground">
                    {Math.round((d.value / total) * 100)}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="glass-panel overflow-hidden">

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
