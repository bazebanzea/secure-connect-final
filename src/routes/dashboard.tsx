import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Shield, Plus, Trash2, CheckCircle2, AlertCircle, Smartphone, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EnrollTotpDialog } from "@/components/EnrollTotpDialog";
import { PasskeysSection } from "@/components/PasskeysSection";
import type { User } from "@supabase/supabase-js";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

type Factor = {
  id: string;
  friendly_name: string;
  factor_type: string;
  verified: boolean;
  created_at: string;
};

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollOpen, setEnrollOpen] = useState(false);

  useEffect(() => {
    document.title = "Tableau de bord — SentinelMFA";
  }, []);

  const loadFactors = useCallback(async () => {
    const { data, error } = await supabase
      .from("mfa_factors")
      .select("id, friendly_name, factor_type, verified, created_at")
      .order("created_at", { ascending: false });
    if (error) { toast.error("Impossible de charger les facteurs"); return; }
    setFactors(data ?? []);
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate({ to: "/login", search: { mode: "login", redirect: "/dashboard" } });
        return;
      }
      if (!mounted) return;
      setUser(data.session.user);
      await loadFactors();
      setLoading(false);
    };
    init();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/login", search: { mode: "login", redirect: "/dashboard" } });
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [navigate, loadFactors]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("mfa_factors").delete().eq("id", id);
    if (error) { toast.error("Suppression impossible"); return; }
    toast.success("Facteur supprimé");
    loadFactors();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const verifiedCount = factors.filter((f) => f.verified).length;
  const isProtected = verifiedCount > 0;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-6 py-10 max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Bonjour, {user?.user_metadata?.display_name || user?.email?.split("@")[0]}
            </h1>
            <p className="mt-1 text-muted-foreground">Gérez vos facteurs d'authentification multi-facteurs.</p>
          </div>
          <Button onClick={() => setEnrollOpen(true)} className="bg-[image:var(--gradient-primary)] shadow-[var(--shadow-elegant)]">
            <Plus className="h-4 w-4" />
            Ajouter un facteur
          </Button>
        </div>

        {/* Status card */}
        <div className={`rounded-xl border p-6 mb-8 ${isProtected ? "bg-success/5 border-success/30" : "bg-destructive/5 border-destructive/30"}`}>
          <div className="flex items-start gap-4">
            <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${isProtected ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
              {isProtected ? <Shield className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold">{isProtected ? "Compte protégé par MFA" : "MFA non activée"}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isProtected
                  ? `Vous avez ${verifiedCount} facteur${verifiedCount > 1 ? "s" : ""} vérifié${verifiedCount > 1 ? "s" : ""}.`
                  : "Ajoutez un facteur TOTP pour sécuriser votre compte."}
              </p>
            </div>
          </div>
        </div>

        {/* Factors list */}
        <div className="rounded-xl border bg-card shadow-[var(--shadow-card)]">
          <div className="p-6 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              Mes facteurs
            </h3>
          </div>
          {factors.length === 0 ? (
            <div className="p-12 text-center">
              <Smartphone className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">Aucun facteur enrôlé</p>
              <p className="text-sm text-muted-foreground mt-1">Ajoutez votre premier facteur TOTP.</p>
              <Button onClick={() => setEnrollOpen(true)} className="mt-6 bg-[image:var(--gradient-primary)]">
                <Plus className="h-4 w-4" />
                Enrôler un facteur
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {factors.map((f) => (
                <li key={f.id} className="flex items-center gap-4 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{f.friendly_name}</p>
                      {f.verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                          <CheckCircle2 className="h-3 w-3" /> Vérifié
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                          En attente
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      TOTP · ajouté le {new Date(f.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(f.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <PasskeysSection />
      </main>

      <EnrollTotpDialog
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        userEmail={user?.email ?? ""}
        onComplete={() => { setEnrollOpen(false); loadFactors(); }}
      />
    </div>
  );
}
