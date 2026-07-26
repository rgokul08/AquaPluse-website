import { createFileRoute } from "@tanstack/react-router";

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
import { qualityReadings, waterPointById } from "@/lib/demo-data";

export const Route = createFileRoute("/app/quality")({
  head: () => ({
    meta: [
      { title: "Water Quality | AquaPulse" },
      {
        name: "description",
        content:
          "pH, turbidity, TDS, chlorine and dissolved oxygen readings with threshold violations flagged.",
      },
      { property: "og:title", content: "Water Quality | AquaPulse" },
      {
        property: "og:description",
        content: "pH, turbidity, TDS and chlorine readings with violations flagged.",
      },
    ],
  }),
  component: QualityPage,
});

const thresholds = {
  ph: { min: 6.5, max: 8.5, label: "pH", unit: "" },
  turbidityNtu: { min: 0, max: 5, label: "Turbidity", unit: "NTU" },
  tdsPpm: { min: 0, max: 500, label: "TDS", unit: "ppm" },
  chlorineMgL: { min: 0.2, max: 1.0, label: "Chlorine", unit: "mg/L" },
  dissolvedOxygenMgL: { min: 5, max: 14, label: "Dissolved O₂", unit: "mg/L" },
} as const;

type Param = keyof typeof thresholds;

function violates(param: Param, value: number) {
  const t = thresholds[param];
  return value < t.min || value > t.max;
}

function QualityPage() {
  const violationCount = qualityReadings.reduce(
    (n, r) => n + (Object.keys(thresholds) as Param[]).filter((p) => violates(p, r[p])).length,
    0,
  );
  const unvalidated = qualityReadings.filter((r) => !r.validated).length;

  return (
    <>
      <PageHeader
        title="Water quality"
        description="Latest laboratory-equivalent parameters per water point, validated against configured thresholds."
        actions={<SourceBadge source="SIMULATED" />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Points sampled" value={qualityReadings.length} tone="primary" />
        <StatCard label="Threshold violations" value={violationCount} tone="critical" />
        <StatCard label="Readings pending validation" value={unvalidated} tone="warning" />
      </div>

      <section className="panel overflow-hidden">
        <div className="border-b border-border p-4 sm:p-5">
          <h2 className="text-base font-semibold">Parameter matrix</h2>
          <p className="text-xs text-muted-foreground">
            Out-of-range values are marked with a red dot and the word “out of range” for non-colour
            accessibility.
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Water point</TableHead>
                {(Object.keys(thresholds) as Param[]).map((p) => (
                  <TableHead key={p} className="text-right">
                    {thresholds[p].label}
                  </TableHead>
                ))}
                <TableHead>Validation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qualityReadings.map((r) => (
                <TableRow key={r.waterPointId}>
                  <TableCell className="font-medium">
                    {waterPointById(r.waterPointId)?.name}
                  </TableCell>
                  {(Object.keys(thresholds) as Param[]).map((p) => {
                    const bad = violates(p, r[p]);
                    return (
                      <TableCell key={p} className="numeric text-right">
                        <span className={bad ? "font-semibold text-critical" : undefined}>
                          {r[p]}
                          {thresholds[p].unit ? ` ${thresholds[p].unit}` : ""}
                        </span>
                        {bad && (
                          <span className="ml-1 text-[10px] uppercase text-critical">
                            out of range
                          </span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-xs">
                    {r.validated ? (
                      <span className="text-healthy">Validated</span>
                    ) : (
                      <span className="text-warning">Pending</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </>
  );
}
