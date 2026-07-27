import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowRight, Droplets, Gauge, MapPin, ShieldCheck } from "lucide-react";

import { SourceBadge, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { statusCounts, villages, waterPoints } from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AquaPulse — Smart Water Intelligence for Villages" },
      {
        name: "description",
        content:
          "AquaPulse monitors village water points in real time: IoT sensors, health scoring, alerts, maintenance and public water availability.",
      },
      { property: "og:title", content: "AquaPulse — Smart Water Intelligence for Villages" },
      {
        property: "og:description",
        content:
          "Real-time IoT monitoring, health scoring and maintenance automation for community water supply.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const publicPoints = waterPoints.filter((w) => w.publiclyVisible).slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="flex items-center gap-2.5">
            <span className="pulse-gradient grid size-8 place-items-center rounded-lg">
              <Gauge aria-hidden className="size-4.5 text-primary-foreground" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">AquaPulse</span>
          </span>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/app">
                Open control centre <ArrowRight aria-hidden className="size-4" />
              </Link>
            </Button>
          </div>

        </nav>
      </header>

      <main>
        <section className="depth-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sidebar-primary">
              Smart water. Real-time intelligence.
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-sidebar-foreground sm:text-5xl">
              Monitor every drop. Protect every community.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-sidebar-foreground/75">
              AquaPulse connects village water points, IoT sensors and field teams into one
              operational picture — health scoring, automated alerts and maintenance that reaches
              the right technician in time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/app">Open control centre</Link>
              </Button>
              <span className="inline-flex items-center rounded-lg border border-sidebar-border px-4 text-sm text-sidebar-foreground/70">
                Public water finder — coming in the next build
              </span>
            </div>

            <dl className="mt-12 grid gap-4 sm:grid-cols-4">
              {[
                ["Monitored points", waterPoints.length],
                ["Villages", villages.length],
                ["Healthy now", statusCounts.HEALTHY],
                ["Needs attention", waterPoints.length - statusCounts.HEALTHY],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-sidebar-border p-4">
                  <dt className="text-xs uppercase tracking-wide text-sidebar-foreground/60">
                    {label}
                  </dt>
                  <dd className="numeric mt-1 text-2xl font-semibold text-sidebar-foreground">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Activity,
                title: "Real-time health engine",
                body: "Every reading is validated, scored 0–100 and explained with the reasons behind the classification.",
              },
              {
                icon: Droplets,
                title: "Quality and flow together",
                body: "pH, turbidity, TDS and chlorine tracked alongside flow, downtime and device battery.",
              },
              {
                icon: ShieldCheck,
                title: "Honest data labelling",
                body: "Simulated, manual, external and real sensor values are always distinguished in the interface.",
              },
            ].map((f) => (
              <article key={f.title} className="panel p-5">
                <f.icon aria-hidden className="size-5 text-primary" />
                <h2 className="mt-3 text-base font-semibold">{f.title}</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Public water point status</h2>
            <SourceBadge source="SIMULATED" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Availability information published for residents. Technician details and device
            identifiers are not shown here.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {publicPoints.map((wp) => (
              <li key={wp.id} className="panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{wp.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin aria-hidden className="size-3" />
                      {wp.habitation}
                    </p>
                  </div>
                  <StatusBadge status={wp.status} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {wp.status === "HEALTHY" || wp.status === "WARNING"
                    ? "Water available at this point."
                    : "Water currently unavailable — repair in progress."}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <p className="mx-auto max-w-6xl px-4 text-xs text-muted-foreground">
          AquaPulse demo build · all readings shown are simulated and clearly labelled.
        </p>
      </footer>
    </div>
  );
}
