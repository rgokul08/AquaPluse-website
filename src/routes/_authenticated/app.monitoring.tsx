import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader, StatCard } from "@/components/stat-card";
import { SourceBadge, StatusBadge } from "@/components/status-badge";
import { flowSeries, statusCounts, waterPoints } from "@/lib/demo-data";

export const Route = createFileRoute("/_authenticated/app/monitoring")({
  head: () => ({
    meta: [
      { title: "Live Monitoring | AquaPulse" },
      {
        name: "description",
        content:
          "Rolling 24-hour flow, usage and offline-device signals across the monitored water network.",
      },
      { property: "og:title", content: "Live Monitoring | AquaPulse" },
      {
        property: "og:description",
        content: "Rolling 24-hour flow, usage and offline-device signals.",
      },
    ],
  }),
  component: MonitoringPage,
});

function MonitoringPage() {
  const reporting = waterPoints.filter((w) => w.status !== "OFFLINE").length;
  const avgFlow = Math.round(flowSeries.reduce((s, f) => s + f.flow, 0) / flowSeries.length);
  const totalUsage = flowSeries.reduce((s, f) => s + f.usage, 0);

  return (
    <>
      <PageHeader
        title="Live monitoring"
        description="Ingestion pipeline output for the last 24 hours. Readings are produced by the AquaPulse device simulator."
        actions={<SourceBadge source="SIMULATED" />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Devices reporting"
          value={`${reporting}/${waterPoints.length}`}
          tone="primary"
        />
        <StatCard label="Average flow" value={avgFlow} unit="L/min" tone="healthy" />
        <StatCard label="Usage (24h)" value={totalUsage.toLocaleString("en-IN")} unit="L" />
      </div>

      <section className="panel p-4 sm:p-5">
        <h2 className="text-base font-semibold">Flow trend</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={flowSeries} margin={{ left: -18, right: 6, top: 6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
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
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="flow"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel p-4 sm:p-5">
        <h2 className="text-base font-semibold">Offline devices per hour</h2>
        <div className="mt-4 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={flowSeries} margin={{ left: -18, right: 6, top: 6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11 }}
                stroke="var(--color-muted-foreground)"
                interval={3}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                stroke="var(--color-muted-foreground)"
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="offline" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel p-4 sm:p-5">
        <h2 className="text-base font-semibold">Pulse grid</h2>
        <p className="text-xs text-muted-foreground">
          One tile per water point, coloured by current classification.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {waterPoints.map((wp) => (
            <div key={wp.id} className="rounded-xl border border-border bg-surface p-3">
              <p className="truncate text-sm font-medium">{wp.name}</p>
              <p className="numeric text-[11px] text-muted-foreground">{wp.code}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <StatusBadge status={wp.status} />
                <span className="numeric text-sm font-semibold">{wp.flowLpm} L/m</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Distribution:{" "}
          {Object.entries(statusCounts)
            .map(([k, v]) => `${k} ${v}`)
            .join(" · ")}
        </p>
      </section>
    </>
  );
}
