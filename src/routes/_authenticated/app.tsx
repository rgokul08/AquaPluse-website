import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-surface">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-3 py-5 sm:px-6 sm:py-7">
            <div className="mx-auto w-full max-w-7xl space-y-6">
              <Outlet />
            </div>
          </main>
        </div>
        <Toaster position="bottom-right" />
      </div>
    </SidebarProvider>
  );
}
