import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Shield, KeyRound, Smartphone, Lock, CheckCircle2, Zap, Globe, Users, Fingerprint, ScanFace, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import heroImg from "@/assets/hero-security.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  useEffect(() => {
    document.title = "SentinelMFA — Plateforme d'authentification multi-facteurs";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[image:var(--gradient-hero)]" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url(${heroImg})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        <div className="container relative mx-auto px-6 py-24 md:py-36">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SOC 2 · ISO 27001 · RGPD
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-[1.1]">
              L'authentification forte,<br />
              <span className="bg-gradient-to-r from-cyan-200 to-white bg-clip-text text-transparent">simplifiée pour l'entreprise.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/75 max-w-2xl leading-relaxed">
              SentinelMFA déploie en quelques minutes une couche d'authentification multi-facteurs robuste pour vos collaborateurs et applications critiques.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-[var(--shadow-glow)]">
                <Link to="/login" search={{ mode: "signup" }}>Démarrer gratuitement</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <Link to="/security">Voir la sécurité</Link>
              </Button>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/70">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> TOTP RFC 6238</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Passkeys & Face ID</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Authenticator intégré</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Aucune carte requise</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-24">
        <div className="max-w-2xl mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Plateforme</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">Une infrastructure MFA pensée pour l'échelle.</h2>
          <p className="mt-4 text-lg text-muted-foreground">Tout ce dont vos équipes sécurité ont besoin pour protéger leurs identités numériques, sans complexité opérationnelle.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Smartphone, title: "TOTP standard", desc: "Compatible avec Google Authenticator, Authy, 1Password et tout client RFC 6238." },
            { icon: Fingerprint, title: "Passkeys & biométrie", desc: "Face ID, Touch ID, Windows Hello et clés de sécurité FIDO2. Connexion sans mot de passe." },
            { icon: QrCode, title: "Authenticator intégré", desc: "Utilisez SentinelMFA comme Google Authenticator pour gérer les codes 2FA de tous vos comptes." },
            { icon: Shield, title: "Chiffrement bout-en-bout", desc: "Secrets stockés chiffrés au repos, jamais transmis en clair." },
            { icon: Zap, title: "Déploiement en minutes", desc: "SDK JavaScript, intégration en moins de 50 lignes." },
            { icon: KeyRound, title: "Multi-facteurs", desc: "TOTP, passkeys, empreinte digitale et reconnaissance faciale en un seul tableau de bord." },
            { icon: Globe, title: "API souveraine", desc: "Données hébergées en Europe, conformité RGPD by design." },
            { icon: ScanFace, title: "Face ID & empreinte", desc: "Authentification biométrique native via le standard WebAuthn. Aucun mot de passe requis." },
            { icon: Users, title: "Gestion centralisée", desc: "Tableau de bord pour superviser les inscriptions et l'activité de tous vos facteurs." },
          ].map((f) => (
            <div key={f.title} className="group rounded-xl border bg-card p-6 shadow-[var(--shadow-card)] transition-all hover:border-primary/30 hover:shadow-[var(--shadow-elegant)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-[image:var(--gradient-primary)] group-hover:text-primary-foreground transition-all">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="bg-[image:var(--gradient-subtle)] border-y">
        <div className="container mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider">Architecture</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">Trois couches, zéro compromis.</h2>
              <p className="mt-4 text-lg text-muted-foreground">De l'application cliente au stockage chiffré, chaque couche applique le principe de moindre privilège.</p>
              <div className="mt-8 space-y-5">
                {[
                  { num: "01", title: "Couche client", desc: "SDK, UI d'enrôlement TOTP, Passkeys WebAuthn et Authenticator intégré." },
                  { num: "02", title: "Couche API", desc: "Vérification cryptographique, biométrie FIDO2, rate limiting, audit." },
                  { num: "03", title: "Couche données", desc: "Secrets chiffrés, clés publiques Passkey, isolation par tenant, RLS strict." },
                ].map((l) => (
                  <div key={l.num} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-primary/30 bg-background font-mono text-sm font-semibold text-primary">{l.num}</div>
                    <div>
                      <h4 className="font-semibold">{l.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{l.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-[image:var(--gradient-primary)] opacity-10 blur-3xl rounded-3xl" />
              <div className="relative rounded-2xl border bg-card p-8 shadow-[var(--shadow-elegant)]">
                <div className="space-y-3">
                  {[
                    { label: "Application cliente", color: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300" },
                    { label: "Passerelle API · TLS 1.3", color: "bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300" },
                    { label: "Service MFA · TOTP + Passkeys + Biométrie", color: "bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-300" },
                    { label: "Vault chiffré · AES-256", color: "bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300" },
                  ].map((row, i) => (
                    <div key={row.label}>
                      <div className={`rounded-lg border-2 px-4 py-3 text-sm font-medium ${row.color}`}>
                        <div className="flex items-center gap-2"><Lock className="h-4 w-4" /> {row.label}</div>
                      </div>
                      {i < 3 && <div className="my-1 ml-6 h-3 w-px bg-border" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-24">
        <div className="relative overflow-hidden rounded-2xl bg-[image:var(--gradient-hero)] p-12 md:p-16 text-center shadow-[var(--shadow-elegant)]">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Activez la MFA en moins de 5 minutes.</h2>
          <p className="mt-4 text-lg text-white/75 max-w-xl mx-auto">Créez votre compte, scannez un QR code, vérifiez. Vous êtes protégé.</p>
          <Button asChild size="lg" className="mt-8 bg-white text-primary hover:bg-white/90">
            <Link to="/login" search={{ mode: "signup" }}>Créer mon compte</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t">
        <div className="container mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>© 2026 SentinelMFA</span>
          </div>
          <div className="flex gap-6">
            <Link to="/security" className="hover:text-foreground">Sécurité</Link>
            <Link to="/pricing" className="hover:text-foreground">Tarifs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
