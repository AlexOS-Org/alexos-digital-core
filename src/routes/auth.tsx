import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { AlexOSLogo } from "@/components/alexos-logo";
import { SupabaseConfigBanner } from "@/components/SupabaseConfigBanner";
import { isAuthorizedAlexOSUser, unauthorizedWorkspaceMessage } from "@/lib/authz";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessMessage, setAccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const completeOAuthOrRestoreSession = async () => {
      const params = new URLSearchParams(window.location.search);
      const authError = params.get("error_description") || params.get("error");
      if (authError) {
        if (!cancelled) setAccessMessage(decodeURIComponent(authError.replace(/\+/g, " ")));
        return;
      }
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState({}, document.title, window.location.pathname);
        if (error) {
          if (!cancelled) toast.error(error.message);
          return;
        }
      }
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      if (isAuthorizedAlexOSUser(data.session.user)) {
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      await supabase.auth.signOut();
      if (!cancelled) setAccessMessage(unauthorizedWorkspaceMessage());
    };
    void completeOAuthOrRestoreSession();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (!isAuthorizedAlexOSUser(data.user)) {
      await supabase.auth.signOut();
      setAccessMessage(unauthorizedWorkspaceMessage());
      return toast.error(unauthorizedWorkspaceMessage());
    }
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth` },
    });
    if (error) {
      setLoading(false);
      toast.error(
        error.message.includes("provider")
          ? `${provider === "google" ? "Google" : "Facebook"} sign-in is not enabled in Supabase Auth yet.`
          : error.message,
      );
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorizedAlexOSUser({ email })) {
      setAccessMessage(unauthorizedWorkspaceMessage());
      return toast.error(unauthorizedWorkspaceMessage());
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. Check your inbox to confirm.");
  };

  return (
    <div className="alexos-auth-shell relative grid min-h-screen overflow-hidden bg-background lg:grid-cols-2">
      <SupabaseConfigBanner />
      <div className="alexos-auth-brand-panel relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <Link to="/" className="w-fit">
          <AlexOSLogo showWordmark />
        </Link>

        <div className="space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-accent/50 px-3 py-1 text-xs font-medium text-sidebar-foreground/80">
            <span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary shadow-[0_0_10px_var(--alexos-glow)]" />
            Powered by Auren Intelligence
          </div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Your personal & business operating system.
          </h1>
          <p className="text-sidebar-foreground/70 max-w-md">
            Command your money, people, goals and operations from one intelligent, banking-grade
            workspace.
          </p>
          <div className="flex items-center gap-2 text-sm text-sidebar-foreground/60">
            <ShieldCheck className="h-4 w-4" />
            Bank-level security · Encrypted at rest
          </div>
        </div>

        <p className="text-xs text-sidebar-foreground/50">
          © {new Date().getFullYear()} AlexOS · Powered by Auren Intelligence
        </p>
      </div>

      <div className="alexos-auth-form-panel flex items-center justify-center p-5 sm:p-10 lg:p-14">
        <Card className="alexos-auth-card w-full max-w-md border-border/60 shadow-2xl shadow-primary/10">
          <CardHeader className="space-y-2">
            <div className="lg:hidden mb-2">
              <AlexOSLogo showWordmark />
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome back
            </CardTitle>
            <CardDescription>Sign in to your AlexOS workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            {accessMessage ? (
              <div
                className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {accessMessage}
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => void handleOAuth("google")}
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt=""
                  aria-hidden="true"
                  className="mr-2 h-4 w-4"
                />
                Continue with Google
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => void handleOAuth("facebook")}
              >
                <img
                  src="https://cdn.simpleicons.org/facebook/1877F2"
                  alt=""
                  aria-hidden="true"
                  className="mr-2 h-4 w-4"
                />
                Continue with Facebook
              </Button>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Social sign-in creates or opens an AlexOS account. The provider must be enabled in
              Supabase Auth first.
            </p>
            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span>or use email</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <Tabs defaultValue="signin">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full shadow-lg shadow-primary/20 transition-shadow hover:shadow-xl hover:shadow-primary/25"
                  >
                    {loading ? "Signing in…" : "Sign in"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email2">Email</Label>
                    <Input
                      id="email2"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password2">Password</Label>
                    <Input
                      id="password2"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full shadow-lg shadow-primary/20 transition-shadow hover:shadow-xl hover:shadow-primary/25"
                  >
                    {loading ? "Creating…" : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
