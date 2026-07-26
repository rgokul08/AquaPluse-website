import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

// TODO: replace with your project URL once a project name or custom domain is set.
const BASE_URL = "";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/app", changefreq: "daily", priority: "0.8" },
          { path: "/app/monitoring", changefreq: "daily", priority: "0.6" },
          { path: "/app/analytics", changefreq: "weekly", priority: "0.6" },
          { path: "/app/water-points", changefreq: "daily", priority: "0.7" },
          { path: "/app/quality", changefreq: "daily", priority: "0.6" },
          { path: "/app/devices", changefreq: "daily", priority: "0.5" },
          { path: "/app/villages", changefreq: "weekly", priority: "0.5" },
          { path: "/app/alerts", changefreq: "hourly", priority: "0.6" },
          { path: "/app/maintenance", changefreq: "daily", priority: "0.6" },
          { path: "/app/technicians", changefreq: "weekly", priority: "0.4" },
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
