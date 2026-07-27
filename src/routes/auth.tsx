import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Gauge, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | AquaPulse" },
      {
        name: "description",
        content:
          "Sign in or create an AquaPulse operator account to access the water intelligence control room.",
      },
      { property: "og:title", content: "Sign in | AquaPulse" },
      {
        property: "og:description",
        content: "Operator access to the AquaPulse water intelligence control room.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/app` },
        });
        if (error) throw error;
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigate({ to: "/app", replace: true });
        } else {
          toast.success("Account created — check your inbox to confirm your email.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/app", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="depth-surface relative hidden flex-col justify-between p-10 lg:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="pulse-gradient grid size-9 place-items-center rounded-xl">
            <Gauge aria-hidden className="size-5 text-primary-foreground" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-primary-foreground">
            AquaPulse
          </span>
        </Link>
        <div className="max-w-md">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-primary-foreground">
            Water intelligence, in one control room.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-primary-foreground/70">
            Live IoT telemetry, health scoring, quality thresholds and maintenance automation for
            every community water point you operate.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/50">Demo build · all readings are simulated</p>
      </section>

      <section className="flex items-center justify-center px-5 py-12">
        <div className="glass-panel w-full max-w-sm p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            {mode === "signin" ? "Sign in" : "Create your account"}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Use your work email to enter the control room."
              : "Register an operator account with your email address."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@aquapulse.io"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New to AquaPulse?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </section>
      <Toaster position="bottom-right" />
    </main>
  );
}
