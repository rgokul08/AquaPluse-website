import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { FlaskConical, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("aquapulse-theme");
    const initial =
      stored === "dark" || stored === "light"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem("aquapulse-theme", next);
      return next;
    });
  };

  return { theme, toggle };
}

export function Topbar() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-3 backdrop-blur sm:px-5">
      <SidebarTrigger className="shrink-0" />

      <span className="inline-flex items-center gap-1.5 rounded-full border border-simulated/35 bg-simulated/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-simulated">
        <FlaskConical aria-hidden className="size-3" />
        Demo / simulation mode
      </span>

      <div className="ml-auto flex items-center gap-1.5">
        <Button asChild variant="ghost" size="sm">
          <Link to="/">Public site</Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <Sun aria-hidden className="size-4" />
          ) : (
            <Moon aria-hidden className="size-4" />
          )}
        </Button>
      </div>
    </header>
  );
}
