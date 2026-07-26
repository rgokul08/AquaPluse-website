import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";

import { PageHeader } from "@/components/stat-card";
import { SourceBadge, StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  deviceForPoint,
  qualityForPoint,
  technicianById,
  villageById,
  villages,
  waterPoints,
  type HealthStatus,
  type WaterPoint,
} from "@/lib/demo-data";

export const Route = createFileRoute("/app/water-points")({
  head: () => ({
    meta: [
      { title: "Water Points | AquaPulse" },
      {
        name: "description",
        content:
          "Search, filter and inspect every monitored water point with health, flow and device detail.",
      },
      { property: "og:title", content: "Water Points | AquaPulse" },
      {
        property: "og:description",
        content: "Search, filter and inspect every monitored water point.",
      },
    ],
  }),
  component: WaterPointsPage,
});

const statuses: Array<HealthStatus | "ALL"> = [
  "ALL",
  "HEALTHY",
  "WARNING",
  "CRITICAL",
  "FAILED",
  "OFFLINE",
];

function WaterPointsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<HealthStatus | "ALL">("ALL");
  const [village, setVillage] = useState("ALL");
  const [selected, setSelected] = useState<WaterPoint | null>(null);

  const rows = useMemo(
    () =>
      waterPoints.filter((wp) => {
        const q = query.trim().toLowerCase();
        const matchesQuery =
          !q ||
          wp.name.toLowerCase().includes(q) ||
          wp.code.toLowerCase().includes(q) ||
          wp.habitation.toLowerCase().includes(q);
        return (
          matchesQuery &&
          (status === "ALL" || wp.status === status) &&
          (village === "ALL" || wp.villageId === village)
        );
      }),
    [query, status, village],
  );

  const device = selected ? deviceForPoint(selected.id) : undefined;
  const quality = selected ? qualityForPoint(selected.id) : undefined;

  return (
    <>
      <PageHeader
        title="Water points"
        description="Every registered source with live health classification. Click a row for the full record."
        actions={<SourceBadge source="SIMULATED" />}
      />

      <div className="panel p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              aria-hidden
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, code or habitation"
              className="pl-9"
              aria-label="Search water points"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as HealthStatus | "ALL")}>
            <SelectTrigger className="sm:w-44" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "ALL" ? "All statuses" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={village} onValueChange={setVillage}>
            <SelectTrigger className="sm:w-48" aria-label="Filter by village">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All villages</SelectItem>
              {villages.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Water point</TableHead>
                <TableHead>Village</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Health</TableHead>
                <TableHead className="text-right">Flow (L/min)</TableHead>
                <TableHead className="text-right">Served</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((wp) => (
                <TableRow key={wp.id}>
                  <TableCell>
                    <p className="font-medium">{wp.name}</p>
                    <p className="numeric text-xs text-muted-foreground">
                      {wp.code} · {wp.sourceType}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {villageById(wp.villageId)?.name}
                    <span className="block text-xs text-muted-foreground">{wp.habitation}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={wp.status} />
                  </TableCell>
                  <TableCell className="numeric text-right">{wp.healthScore}</TableCell>
                  <TableCell className="numeric text-right">{wp.flowLpm}</TableCell>
                  <TableCell className="numeric text-right">{wp.populationServed}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(wp)}>
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No water points match these filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>
                  {selected.code} · {villageById(selected.villageId)?.name} / {selected.habitation}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 px-4 pb-8">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={selected.status} />
                  <SourceBadge source={selected.source} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Health score", `${selected.healthScore} / 100`],
                    ["Confidence", `${selected.confidence}%`],
                    ["Quality score", `${selected.qualityScore} / 100`],
                    ["Flow", `${selected.flowLpm} L/min`],
                    ["Population served", selected.populationServed.toLocaleString("en-IN")],
                    ["Service radius", `${selected.serviceRadiusM} m`],
                    ["Battery", device ? `${device.batteryPct}%` : "—"],
                    ["Signal", device ? `${device.signalDbm} dBm` : "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-border bg-surface p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {label}
                      </p>
                      <p className="numeric mt-1 text-sm font-medium">{value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-sm font-semibold">Health engine reasoning</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {selected.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                  <p className="mt-2 rounded-lg border border-primary/25 bg-primary/10 p-3 text-sm">
                    {selected.recommendedAction}
                  </p>
                </div>

                {quality && (
                  <div>
                    <h3 className="text-sm font-semibold">Latest quality reading</h3>
                    <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <Row label="pH" value={quality.ph} />
                      <Row label="Turbidity" value={`${quality.turbidityNtu} NTU`} />
                      <Row label="TDS" value={`${quality.tdsPpm} ppm`} />
                      <Row label="Chlorine" value={`${quality.chlorineMgL} mg/L`} />
                    </dl>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Device {selected.deviceId} · assigned to{" "}
                  {technicianById(selected.technicianId)?.name ?? "unassigned"}
                  <br />
                  Last reading {new Date(selected.lastReadingAt).toLocaleString()}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-2.5">
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="numeric text-sm font-medium">{value}</dd>
    </div>
  );
}
