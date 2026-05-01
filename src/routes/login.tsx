import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PasskeyLoginButton } from "@/components/PasskeyLoginButton";

export const Route = createFileRoute("/login")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { mode: "login" | "signup"; redirect?: string } => ({
    mode: (s.mode as string) === "signup" ? "signup" : "login",
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const mode = search.mode;
  const redirect = search.redirect ?? "/dashboard";
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Connexion — SentinelMFA";
  }, []);

  useEffect(() => setIsSignup(mode === "signup"), [mode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirect });
    });
  }, [navigate, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Compte créé avec succès");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connexion réussie");
        navigate({ to: redirect });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      toast.error(msg.includes("Invalid login") ? "Email ou mot de passe incorrect" : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[image:var(--gradient-hero)] p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-2 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
            <Shield className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">SentinelMFA</span>
        </Link>
        <div className="text-white relative z-10">
          <h2 className="text-3xl font-bold leading-tight">
            L'authentification forte pour vos applications critiques.
          </h2>
          <p className="mt-4 text-white/75">
            Rejoignez les entreprises qui font confiance à SentinelMFA pour protéger leurs accès.
          </p>
        </div>
        <div className="text-xs text-white/50">Conforme SOC 2 · ISO 27001 · RGPD</div>
      </div>

      {/* Right form */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-semibold">SentinelMFA</span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isSignup ? "Créer un compte" : "Connexion"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isSignup ? "Démarrez en quelques secondes." : "Heureux de vous revoir."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="name">Nom d'affichage</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jean Dupont"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@entreprise.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Au moins 8 caractères"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-elegant)]"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSignup ? "Créer mon compte" : "Se connecter"}
            </Button>
          </form>

          {!isSignup && (
            <>
              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                ou
                <div className="h-px flex-1 bg-border" />
              </div>
              <PasskeyLoginButton email={email} onSuccess={() => navigate({ to: redirect })} />
            </>
          )}

          <p className="mt-6 text-sm text-center text-muted-foreground">
            {isSignup ? "Déjà un compte ? " : "Pas encore de compte ? "}
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-primary font-medium hover:underline"
            >
              {isSignup ? "Se connecter" : "Créer un compte"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
