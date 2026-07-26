import { createFileRoute } from "@tanstack/react-router";
import { BatteryLow, Signal, Wifi } from "lucide-react";

import { PageHeader, StatCard } from "@/components/stat-card";
import { SourceBadge, StatusBadge } from "@/components/status-badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { devices, waterPointById } from "@/lib/demo-data";

export const Route = createFileRoute("/app/devices")({
  head: () => ({
    meta: [
      { title: "IoT Devices | AquaPulse" },
      {
        name: "description",
        content:
          "ESP32 device registry with heartbeat, battery, signal, firmware and connectivity health.",
      },
      { property: "og:title", content: "IoT Devices | AquaPulse" },
      {
        property: "og:description",
        content: "ESP32 device registry with heartbeat, battery and firmware health.",
      },
    ],
  }),
  component: DevicesPage,
});

function DevicesPage() {
  const lowBattery = devices.filter((d) => d.batteryPct < 25).length;
  const weakSignal = devices.filter((d) => d.signalDbm < -100).length;
  const outdated = devices.filter((d) => d.firmware !== "v1.5.0").length;

  return (
    <>
      <PageHeader
        title="IoT devices"
        description="Every AquaNode controller in the field. All units are currently simulated ESP32 nodes."
        actions={<SourceBadge source="SIMULATED" />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Low battery"
          value={lowBattery}
          tone="critical"
          icon={<BatteryLow className="size-4" />}
        />
        <StatCard
          label="Weak signal"
          value={weakSignal}
          tone="warning"
          icon={<Signal className="size-4" />}
        />
        <StatCard label="Firmware behind" value={outdated} icon={<Wifi className="size-4" />} />
      </div>

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Water point</TableHead>
                <TableHead>Health</TableHead>
                <TableHead className="w-40">Battery</TableHead>
                <TableHead className="text-right">Signal</TableHead>
                <TableHead className="text-right">Uptime</TableHead>
                <TableHead>Firmware</TableHead>
                <TableHead>Last heartbeat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <p className="numeric font-medium">{d.serial}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.connectivity} · simulated device
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">{waterPointById(d.waterPointId)?.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={d.health} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={d.batteryPct} className="h-1.5" />
                      <span className="numeric text-xs">{d.batteryPct}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="numeric text-right">{d.signalDbm} dBm</TableCell>
                  <TableCell className="numeric text-right">{d.uptimePct}%</TableCell>
                  <TableCell className="numeric text-sm">{d.firmware}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(d.lastHeartbeatAt).toLocaleString()}
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
