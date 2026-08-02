import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/auth/AuthForm";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-5xl grid gap-10 lg:grid-cols-2 items-center">
        <div className="space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-accent/50 px-3 py-1 text-xs font-medium text-sidebar-foreground/80">
            <span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary shadow-[0_0_10px_var(--alexos-glow)]" />
            Powered by AlexOS Intelligence
          </div>

          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Your personal & business operating system.
          </h1>

          <p className="text-muted-foreground leading-7">
            Manage money, customers, goals and operations from one intelligent command center.
          </p>
        </div>

        <AuthForm />

        <p className="text-xs text-sidebar-foreground/50 lg:col-span-2">
          © {new Date().getFullYear()} AlexOS · Powered by AlexOS Intelligence
        </p>
      </div>
    </div>
  );
}
