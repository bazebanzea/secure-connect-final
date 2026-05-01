import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
});

function PricingPage() {
  useEffect(() => {
    document.title = "Tarifs — SentinelMFA";
  }, []);

  const plans = [
    { name: "Starter", price: "0€", desc: "Parfait pour démarrer.", features: ["Jusqu'à 100 utilisateurs", "TOTP illimité", "Support communauté"], featured: false },
    { name: "Business", price: "0,50€", unit: "/utilisateur/mois", desc: "Pour les équipes en croissance.", features: ["Utilisateurs illimités", "Audit logs 90 jours", "Support email prioritaire", "SSO"], featured: true },
    { name: "Enterprise", price: "Sur devis", desc: "Pour les grandes organisations.", features: ["SLA 99,99%", "Audit logs illimités", "Support dédié 24/7", "Déploiement on-premise"], featured: false },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Tarifs</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">Une tarification claire.</h1>
          <p className="mt-5 text-lg text-muted-foreground">Commencez gratuitement, payez à l'usage quand vous grandissez.</p>
        </div>
        <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p) => (
            <div key={p.name} className={`relative rounded-2xl border p-8 ${p.featured ? "border-primary bg-card shadow-[var(--shadow-elegant)]" : "bg-card shadow-[var(--shadow-card)]"}`}>
              {p.featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[image:var(--gradient-primary)] px-3 py-1 text-xs font-semibold text-primary-foreground">Recommandé</div>}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">{p.price}</span>
                {p.unit && <span className="text-sm text-muted-foreground">{p.unit}</span>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              <Button asChild className={`mt-6 w-full ${p.featured ? "bg-[image:var(--gradient-primary)]" : ""}`} variant={p.featured ? "default" : "outline"}>
                <Link to="/login" search={{ mode: "signup" }}>Commencer</Link>
              </Button>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
