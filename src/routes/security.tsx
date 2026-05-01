import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Shield, Lock, FileCheck, Globe, Server, Eye, Fingerprint, ScanFace } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/security")({
  component: SecurityPage,
});

function SecurityPage() {
  useEffect(() => {
    document.title = "Sécurité — SentinelMFA";
  }, []);

  const items = [
    {
      icon: Lock,
      title: "Chiffrement AES-256",
      desc: "Tous les secrets TOTP sont chiffrés au repos avec AES-256-GCM.",
    },
    {
      icon: Shield,
      title: "TLS 1.3 partout",
      desc: "Toutes les communications réseau utilisent TLS 1.3 avec PFS.",
    },
    {
      icon: FileCheck,
      title: "RFC 6238",
      desc: "Implémentation conforme du standard TOTP, fenêtre de tolérance configurable.",
    },
    {
      icon: Fingerprint,
      title: "WebAuthn FIDO2",
      desc: "Passkeys et biométrie conformes au standard FIDO2. Clés privées isolées sur l'appareil, jamais transmises.",
    },
    {
      icon: ScanFace,
      title: "Biométrie locale",
      desc: "Face ID, Touch ID et Windows Hello restent sur votre appareil. Seule une clé publique est stockée côté serveur.",
    },
    {
      icon: Globe,
      title: "Hébergement UE",
      desc: "Données stockées exclusivement en Union Européenne, conforme RGPD.",
    },
    {
      icon: Server,
      title: "Isolation tenant",
      desc: "Row-Level Security stricte au niveau base de données.",
    },
    {
      icon: Eye,
      title: "Audit complet",
      desc: "Journalisation de tous les événements d'authentification.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="border-b bg-[image:var(--gradient-subtle)]">
        <div className="container mx-auto px-6 py-20">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Sécurité</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight max-w-3xl">
            La sécurité n'est pas une fonctionnalité, c'est notre fondation.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
            SentinelMFA est conçu selon les principes du Zero Trust et audité régulièrement par des
            tiers indépendants.
          </p>
        </div>
      </section>
      <section className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-6">
          {items.map((it) => (
            <div
              key={it.title}
              className="rounded-xl border bg-card p-7 shadow-[var(--shadow-card)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <it.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{it.title}</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">{it.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
