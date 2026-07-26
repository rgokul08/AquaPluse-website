/**
 * AquaPulse demo dataset.
 *
 * IMPORTANT: every record here is SIMULATED data used to make the platform
 * usable before real IoT devices / the cloud backend are connected. Each
 * record carries an explicit `source` field and the UI must label it as
 * SIMULATED wherever it is displayed. Values are deterministic (seeded) so
 * server and client render identically.
 */

export type HealthStatus = "HEALTHY" | "WARNING" | "CRITICAL" | "FAILED" | "OFFLINE";
export type DataSource = "REAL_SENSOR" | "SIMULATED" | "MANUAL" | "EXTERNAL";

export interface Village {
  id: string;
  name: string;
  district: string;
  habitations: string[];
  population: number;
  lat: number;
  lng: number;
}

export interface WaterPoint {
  id: string;
  code: string;
  name: string;
  villageId: string;
  habitation: string;
  lat: number;
  lng: number;
  sourceType: "Borewell" | "Overhead Tank" | "Handpump" | "Piped Supply" | "Open Well";
  installedOn: string;
  status: HealthStatus;
  healthScore: number;
  confidence: number;
  qualityScore: number;
  flowLpm: number;
  populationServed: number;
  serviceRadiusM: number;
  lastReadingAt: string;
  lastMaintenanceAt: string;
  technicianId: string | null;
  deviceId: string;
  reasons: string[];
  recommendedAction: string;
  source: DataSource;
  publiclyVisible: boolean;
}

export interface Device {
  id: string;
  serial: string;
  waterPointId: string;
  firmware: string;
  hardware: string;
  lastHeartbeatAt: string;
  batteryPct: number;
  signalDbm: number;
  uptimePct: number;
  connectivity: "LTE-M" | "WiFi" | "LoRaWAN";
  mode: "REAL_DEVICE" | "SIMULATED_DEVICE";
  health: HealthStatus;
}

export interface QualityReading {
  waterPointId: string;
  ph: number;
  turbidityNtu: number;
  tdsPpm: number;
  temperatureC: number;
  conductivityUs: number;
  chlorineMgL: number;
  dissolvedOxygenMgL: number;
  measuredAt: string;
  source: DataSource;
  validated: boolean;
}

export interface Alert {
  id: string;
  waterPointId: string;
  category:
    | "Water failure"
    | "No flow"
    | "Low flow"
    | "Offline"
    | "Low battery"
    | "Weak signal"
    | "Water quality"
    | "Sensor anomaly"
    | "Long downtime";
  severity: "critical" | "high" | "medium" | "low";
  status: "NEW" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  message: string;
  raisedAt: string;
  source: DataSource;
}

export interface Ticket {
  id: string;
  waterPointId: string;
  title: string;
  priority: "P1" | "P2" | "P3";
  status: "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "VERIFYING" | "CLOSED";
  technicianId: string | null;
  createdAt: string;
  slaHours: number;
  autoCreated: boolean;
}

export interface Technician {
  id: string;
  name: string;
  villageId: string;
  skills: string[];
  openTickets: number;
  avgRepairHours: number;
  completionRate: number;
  available: boolean;
}

export const DEMO_MODE = true;
export const DATA_GENERATED_AT = "2026-07-26T06:00:00.000Z";

/* deterministic pseudo-random so SSR and client agree */
function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export const villages: Village[] = [
  {
    id: "vlg-01",
    name: "Kadambur",
    district: "Erode",
    habitations: ["Kadambur Main", "Pallam Colony", "Mettu Street"],
    population: 4820,
    lat: 11.3421,
    lng: 77.7172,
  },
  {
    id: "vlg-02",
    name: "Thalavaipettai",
    district: "Erode",
    habitations: ["North Thalavai", "South Thalavai"],
    population: 3110,
    lat: 11.3702,
    lng: 77.6821,
  },
  {
    id: "vlg-03",
    name: "Anaimalai",
    district: "Coimbatore",
    habitations: ["Anaimalai Town", "Kallar Hamlet", "Periyakottai"],
    population: 6740,
    lat: 10.5836,
    lng: 76.9312,
  },
  {
    id: "vlg-04",
    name: "Sirumugai",
    district: "Coimbatore",
    habitations: ["Sirumugai East", "Bhavani Bank"],
    population: 2580,
    lat: 11.3186,
    lng: 76.9421,
  },
];

const sourceTypes: WaterPoint["sourceType"][] = [
  "Borewell",
  "Overhead Tank",
  "Handpump",
  "Piped Supply",
  "Open Well",
];

const statusPlan: HealthStatus[] = [
  "HEALTHY",
  "HEALTHY",
  "HEALTHY",
  "WARNING",
  "HEALTHY",
  "CRITICAL",
  "HEALTHY",
  "OFFLINE",
  "WARNING",
  "HEALTHY",
  "FAILED",
  "HEALTHY",
  "WARNING",
  "HEALTHY",
  "CRITICAL",
  "HEALTHY",
  "HEALTHY",
  "OFFLINE",
];

const reasonBank: Record<HealthStatus, { reasons: string[]; action: string }> = {
  HEALTHY: {
    reasons: [
      "Flow within expected band",
      "Device reporting on schedule",
      "Quality parameters nominal",
    ],
    action: "No action required. Next routine inspection as scheduled.",
  },
  WARNING: {
    reasons: ["Flow 22% below 7-day average", "Battery at 34%", "1 sensor spike in last 24h"],
    action: "Add to next field round within 7 days.",
  },
  CRITICAL: {
    reasons: [
      "Flow below threshold for 3 hours",
      "Battery at 18%",
      "2 failures in previous 7 days",
    ],
    action: "Schedule technician inspection within 24 hours.",
  },
  FAILED: {
    reasons: [
      "Zero flow across 6 consecutive readings",
      "Pump not responding",
      "Community reports raised",
    ],
    action: "Dispatch technician immediately. P1 ticket raised.",
  },
  OFFLINE: {
    reasons: ["No heartbeat for 9 hours", "Last reading stale", "Signal lost at -114 dBm"],
    action: "Verify connectivity and power at site.",
  },
};

const names = [
  "Panchayat Office Borewell",
  "School Overhead Tank",
  "Bus Stand Handpump",
  "Temple Street Supply",
  "PHC Borewell",
  "Market Yard Tank",
  "Colony Handpump",
  "Riverside Open Well",
  "Anganwadi Supply",
];

function iso(hoursAgo: number) {
  return new Date(Date.parse(DATA_GENERATED_AT) - hoursAgo * 3600_000).toISOString();
}

export const waterPoints: WaterPoint[] = statusPlan.map((status, i) => {
  const village = villages[i % villages.length];
  const r = seeded(i + 1);
  const healthByStatus: Record<HealthStatus, number> = {
    HEALTHY: 82 + Math.round(r * 16),
    WARNING: 58 + Math.round(r * 12),
    CRITICAL: 34 + Math.round(r * 14),
    FAILED: 8 + Math.round(r * 12),
    OFFLINE: 25 + Math.round(r * 10),
  };
  return {
    id: `wp-${String(i + 1).padStart(3, "0")}`,
    code: `AQP-${village.district.slice(0, 2).toUpperCase()}-${String(i + 101)}`,
    name: names[i % names.length],
    villageId: village.id,
    habitation: village.habitations[i % village.habitations.length],
    lat: village.lat + (seeded(i + 20) - 0.5) * 0.05,
    lng: village.lng + (seeded(i + 40) - 0.5) * 0.05,
    sourceType: sourceTypes[i % sourceTypes.length],
    installedOn: `20${18 + (i % 6)}-0${(i % 9) + 1}-1${i % 9}`,
    status,
    healthScore: healthByStatus[status],
    confidence: 84 + Math.round(seeded(i + 60) * 14),
    qualityScore: status === "FAILED" ? 41 : 68 + Math.round(seeded(i + 80) * 30),
    flowLpm:
      status === "FAILED" || status === "OFFLINE"
        ? 0
        : status === "CRITICAL"
          ? Math.round(seeded(i + 90) * 4)
          : 12 + Math.round(seeded(i + 100) * 26),
    populationServed: 120 + Math.round(seeded(i + 120) * 780),
    serviceRadiusM: 300 + Math.round(seeded(i + 140) * 700),
    lastReadingAt: status === "OFFLINE" ? iso(9 + i) : iso(seeded(i + 160) * 2),
    lastMaintenanceAt: iso(24 * (5 + Math.round(seeded(i + 180) * 90))),
    technicianId: `tech-0${(i % 4) + 1}`,
    deviceId: `dev-${String(i + 1).padStart(3, "0")}`,
    reasons: reasonBank[status].reasons,
    recommendedAction: reasonBank[status].action,
    source: "SIMULATED",
    publiclyVisible: true,
  };
});

export const devices: Device[] = waterPoints.map((wp, i) => ({
  id: wp.deviceId,
  serial: `ESP32-AQP-${String(90210 + i)}`,
  waterPointId: wp.id,
  firmware: i % 5 === 0 ? "v1.4.2" : "v1.5.0",
  hardware: "AquaNode R3",
  lastHeartbeatAt: wp.status === "OFFLINE" ? iso(9 + i) : iso(seeded(i + 200) * 0.5),
  batteryPct:
    wp.status === "CRITICAL"
      ? 14 + Math.round(seeded(i + 210) * 8)
      : 46 + Math.round(seeded(i + 220) * 52),
  signalDbm: wp.status === "OFFLINE" ? -114 : -62 - Math.round(seeded(i + 230) * 40),
  uptimePct:
    wp.status === "HEALTHY"
      ? 97 + Math.round(seeded(i + 240) * 3)
      : 71 + Math.round(seeded(i + 250) * 20),
  connectivity: (["LTE-M", "WiFi", "LoRaWAN"] as const)[i % 3],
  mode: "SIMULATED_DEVICE",
  health: wp.status,
}));

export const qualityReadings: QualityReading[] = waterPoints.map((wp, i) => ({
  waterPointId: wp.id,
  ph: Number((6.4 + seeded(i + 300) * 1.9).toFixed(2)),
  turbidityNtu: Number((0.4 + seeded(i + 310) * 5.6).toFixed(2)),
  tdsPpm: Math.round(180 + seeded(i + 320) * 720),
  temperatureC: Number((25 + seeded(i + 330) * 8).toFixed(1)),
  conductivityUs: Math.round(320 + seeded(i + 340) * 900),
  chlorineMgL: Number((0.1 + seeded(i + 350) * 0.9).toFixed(2)),
  dissolvedOxygenMgL: Number((4.2 + seeded(i + 360) * 4).toFixed(2)),
  measuredAt: wp.lastReadingAt,
  source: "SIMULATED",
  validated: i % 7 !== 0,
}));

export const technicians: Technician[] = [
  {
    id: "tech-01",
    name: "R. Meenakshi",
    villageId: "vlg-01",
    skills: ["Pump repair", "Sensor calibration"],
    openTickets: 3,
    avgRepairHours: 4.2,
    completionRate: 94,
    available: true,
  },
  {
    id: "tech-02",
    name: "S. Karthik",
    villageId: "vlg-02",
    skills: ["Electrical", "Borewell"],
    openTickets: 5,
    avgRepairHours: 6.8,
    completionRate: 88,
    available: true,
  },
  {
    id: "tech-03",
    name: "A. Devi",
    villageId: "vlg-03",
    skills: ["Water quality", "Chlorination"],
    openTickets: 1,
    avgRepairHours: 3.1,
    completionRate: 97,
    available: false,
  },
  {
    id: "tech-04",
    name: "M. Prabhu",
    villageId: "vlg-04",
    skills: ["Plumbing", "IoT devices"],
    openTickets: 2,
    avgRepairHours: 5.4,
    completionRate: 91,
    available: true,
  },
];

const alertPlan: Array<Pick<Alert, "category" | "severity" | "message">> = [
  { category: "No flow", severity: "critical", message: "Zero flow across 6 consecutive readings" },
  { category: "Low battery", severity: "high", message: "Battery dropped to 18%" },
  { category: "Offline", severity: "high", message: "No heartbeat received for 9 hours" },
  {
    category: "Water quality",
    severity: "medium",
    message: "Turbidity 5.4 NTU exceeds 5.0 NTU threshold",
  },
  { category: "Low flow", severity: "medium", message: "Flow 42% below 7-day baseline" },
  {
    category: "Sensor anomaly",
    severity: "low",
    message: "Stuck flow value detected across 4 readings",
  },
  { category: "Weak signal", severity: "low", message: "Signal degraded to -102 dBm" },
  {
    category: "Long downtime",
    severity: "critical",
    message: "Water point unavailable for 31 hours",
  },
];

const alertStatuses: Alert["status"][] = ["NEW", "NEW", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED"];

export const alerts: Alert[] = alertPlan.map((a, i) => ({
  id: `alr-${String(i + 1).padStart(3, "0")}`,
  waterPointId: waterPoints[(i * 3 + 5) % waterPoints.length].id,
  status: alertStatuses[i % alertStatuses.length],
  raisedAt: iso(1 + i * 3),
  source: "SIMULATED",
  ...a,
}));

export const tickets: Ticket[] = [
  {
    id: "tkt-001",
    waterPointId: "wp-011",
    title: "Pump not responding — zero flow",
    priority: "P1",
    status: "IN_PROGRESS",
    technicianId: "tech-02",
    createdAt: iso(6),
    slaHours: 24,
    autoCreated: true,
  },
  {
    id: "tkt-002",
    waterPointId: "wp-006",
    title: "Battery replacement + flow sensor check",
    priority: "P2",
    status: "ASSIGNED",
    technicianId: "tech-01",
    createdAt: iso(19),
    slaHours: 48,
    autoCreated: true,
  },
  {
    id: "tkt-003",
    waterPointId: "wp-008",
    title: "Device offline — verify connectivity",
    priority: "P2",
    status: "OPEN",
    technicianId: null,
    createdAt: iso(9),
    slaHours: 48,
    autoCreated: true,
  },
  {
    id: "tkt-004",
    waterPointId: "wp-004",
    title: "Turbidity above threshold — collect sample",
    priority: "P3",
    status: "VERIFYING",
    technicianId: "tech-03",
    createdAt: iso(52),
    slaHours: 96,
    autoCreated: false,
  },
];

/** 24 hourly flow + usage points, deterministic. */
export const flowSeries = Array.from({ length: 24 }, (_, h) => ({
  hour: `${String(h).padStart(2, "0")}:00`,
  flow: Math.round(14 + Math.sin((h / 24) * Math.PI * 2) * 9 + seeded(h + 400) * 5),
  usage: Math.round(220 + Math.sin(((h - 4) / 24) * Math.PI * 2) * 140 + seeded(h + 500) * 60),
  offline: h % 9 === 0 ? 2 : h % 5 === 0 ? 1 : 0,
}));

export const uptimeSeries = Array.from({ length: 14 }, (_, d) => ({
  day: `D-${13 - d}`,
  uptime: Number((92 + seeded(d + 600) * 7).toFixed(1)),
  failures: d % 4 === 0 ? 2 : d % 3 === 0 ? 1 : 0,
  mttrHours: Number((3 + seeded(d + 700) * 5).toFixed(1)),
}));

export function villageById(id: string) {
  return villages.find((v) => v.id === id);
}
export function waterPointById(id: string) {
  return waterPoints.find((w) => w.id === id);
}
export function technicianById(id: string | null) {
  return technicians.find((t) => t.id === id);
}
export function deviceForPoint(id: string) {
  return devices.find((d) => d.waterPointId === id);
}
export function qualityForPoint(id: string) {
  return qualityReadings.find((q) => q.waterPointId === id);
}

export const statusCounts = waterPoints.reduce<Record<HealthStatus, number>>(
  (acc, wp) => {
    acc[wp.status] += 1;
    return acc;
  },
  { HEALTHY: 0, WARNING: 0, CRITICAL: 0, FAILED: 0, OFFLINE: 0 },
);

/** Haversine distance in km. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
