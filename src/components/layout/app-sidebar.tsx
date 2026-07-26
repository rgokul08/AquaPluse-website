import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Cpu,
  Droplets,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  MapPin,
  Users,
  Wrench,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const groups = [
  {
    label: "Command",
    items: [
      { title: "Overview", url: "/app", icon: LayoutDashboard, exact: true },
      { title: "Live monitoring", url: "/app/monitoring", icon: Activity },
      { title: "Analytics", url: "/app/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      { title: "Water points", url: "/app/water-points", icon: Droplets },
      { title: "Water quality", url: "/app/quality", icon: FlaskConical },
      { title: "IoT devices", url: "/app/devices", icon: Cpu },
      { title: "Villages", url: "/app/villages", icon: MapPin },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Alerts", url: "/app/alerts", icon: AlertTriangle },
      { title: "Maintenance", url: "/app/maintenance", icon: Wrench },
      { title: "Technicians", url: "/app/technicians", icon: Users },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(`${url}/`);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/app" className="flex items-center gap-2.5 px-2 py-2">
          <span className="pulse-gradient grid size-8 shrink-0 place-items-center rounded-lg">
            <Gauge aria-hidden className="size-4.5 text-primary-foreground" />
          </span>
          {!collapsed && (
            <span className="flex flex-col leading-tight">
              <span className="font-display text-sm font-semibold tracking-tight">AquaPulse</span>
              <span className="text-[11px] text-sidebar-foreground/60">Water intelligence</span>
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url, item.exact)}
                      tooltip={item.title}
                    >
                      <Link to={item.url}>
                        <item.icon aria-hidden className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && (
          <p className="px-2 py-1 text-[11px] leading-relaxed text-sidebar-foreground/60">
            Demo build · all readings are simulated
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
