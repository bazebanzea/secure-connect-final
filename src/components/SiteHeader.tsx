import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Sentinel<span className="text-primary">MFA</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition-colors">Plateforme</Link>
          <Link to="/security" activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition-colors">Sécurité</Link>
          <Link to="/pricing" activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition-colors">Tarifs</Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard">Tableau de bord</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/authenticator">Authenticator</Link>
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Connexion</Link>
              </Button>
              <Button asChild size="sm" className="bg-[image:var(--gradient-primary)] shadow-[var(--shadow-elegant)]">
                <Link to="/login" search={{ mode: "signup" }}>Démarrer</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
