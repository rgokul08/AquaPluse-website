import { createFileRoute } from "@tanstack/react-router";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader, StatCard } from "@/components/stat-card";
import { SourceBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { uptimeSeries, villageById, villages, waterPoints } from "@/lib/demo-data";

export const Route = createFileRoute("/_authenticated/app/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics | AquaPulse" },
      {
        name: "description",
        content:
          "Uptime, failure rate, MTTR and per-village service performance for the water network.",
      },
      { property: "og:title", content: "Analytics | AquaPulse" },
      {
        property: "og:description",
        content: "Uptime, failure rate, MTTR and per-village service performance.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const avgUptime = (uptimeSeries.reduce((s, d) => s + d.uptime, 0) / uptimeSeries.length).toFixed(
    1,
  );
  const failures = uptimeSeries.reduce((s, d) => s + d.failures, 0);
  const mttr = (uptimeSeries.reduce((s, d) => s + d.mttrHours, 0) / uptimeSeries.length).toFixed(1);

  const byVillage = villages.map((v) => {
    const points = waterPoints.filter((w) => w.villageId === v.id);
    const healthy = points.filter((p) => p.status === "HEALTHY").length;
    return {
      village: v.name,
      district: v.district,
      points: points.length,
      healthy,
      coverage: Math.min(
        100,
        Math.round((points.reduce((s, p) => s + p.populationServed, 0) / v.population) * 100),
      ),
      avgHealth: Math.round(points.reduce((s, p) => s + p.healthScore, 0) / (points.length || 1)),
    };
  });

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Fourteen-day operational performance derived from simulated readings and ticket history."
        actions={<SourceBadge source="SIMULATED" />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Average uptime" value={avgUptime} unit="%" tone="healthy" />
        <StatCard label="Failures (14d)" value={failures} tone="critical" />
        <StatCard label="MTTR" value={mttr} unit="hrs" tone="warning" />
      </div>

      <section className="panel p-4 sm:p-5">
        <h2 className="text-base font-semibold">Uptime and repair time</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={uptimeSeries} margin={{ left: -18, right: 6, top: 6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="uptime"
                name="Uptime %"
                stroke="var(--color-chart-2)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="mttrHours"
                name="MTTR (h)"
                stroke="var(--color-chart-3)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-border p-4 sm:p-5">
          <h2 className="text-base font-semibold">Service coverage by village</h2>
          <p className="text-xs text-muted-foreground">
            Coverage compares estimated population served against village population.
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Village</TableHead>
                <TableHead>District</TableHead>
                <TableHead className="text-right">Water points</TableHead>
                <TableHead className="text-right">Healthy</TableHead>
                <TableHead className="text-right">Avg health</TableHead>
                <TableHead className="text-right">Coverage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byVillage.map((row) => (
                <TableRow key={row.village}>
                  <TableCell className="font-medium">{row.village}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.district}</TableCell>
                  <TableCell className="numeric text-right">{row.points}</TableCell>
                  <TableCell className="numeric text-right">{row.healthy}</TableCell>
                  <TableCell className="numeric text-right">{row.avgHealth}</TableCell>
                  <TableCell className="numeric text-right">{row.coverage}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        Highest-risk point right now:{" "}
        {(() => {
          const worst = [...waterPoints].sort((a, b) => a.healthScore - b.healthScore)[0];
          return `${worst.name} (${villageById(worst.villageId)?.name}) at health ${worst.healthScore}`;
        })()}
      </p>
    </>
  );
}
