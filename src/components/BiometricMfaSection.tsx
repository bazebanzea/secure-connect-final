import { useState } from "react";
import { ScanFace, Fingerprint, Monitor, ShieldCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type BiometricType = "face" | "fingerprint" | "platform";

const biometricInfo: Record<
  BiometricType,
  { icon: typeof ScanFace; label: string; desc: string; color: string }
> = {
  face: {
    icon: ScanFace,
    label: "Face ID",
    desc: "Reconnaissance faciale via Apple Face ID ou Windows Hello. Votre visage est votre mot de passe.",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  fingerprint: {
    icon: Fingerprint,
    label: "Empreinte digitale",
    desc: "Touch ID, empreinte Android ou capteur d'empreinte Windows Hello. Rapide et sécurisé.",
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  platform: {
    icon: Monitor,
    label: "Windows Hello / PIN",
    desc: "Authentification via le système de sécurité intégré de votre OS : PIN, reconnaissance faciale ou empreinte.",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
};

export function BiometricMfaSection() {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="rounded-xl border bg-card shadow-[var(--shadow-card)] mt-6">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Authentification biométrique
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Face ID, Touch ID et Windows Hello sont gérés via vos Passkeys.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setInfoOpen(true)}
            className="text-muted-foreground"
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid sm:grid-cols-3 gap-4">
          {(Object.entries(biometricInfo) as [BiometricType, (typeof biometricInfo)[BiometricType]][]).map(
            ([key, info]) => (
              <div
                key={key}
                className="rounded-xl border p-5 text-center hover:border-primary/20 transition-colors"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl mx-auto ${info.color}`}
                >
                  <info.icon className="h-6 w-6" />
                </div>
                <p className="font-medium text-sm mt-3">{info.label}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {info.desc.split(".")[0]}.
                </p>
              </div>
            )
          )}
        </div>

        <div className="mt-5 rounded-lg bg-accent/40 p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Comment ça marche ?</strong> Lorsque vous
            enregistrez une Passkey (section ci-dessus), votre appareil utilise
            automatiquement la biométrie disponible — Face ID sur iPhone,
            Touch ID sur Mac, Windows Hello sur PC. C'est le standard WebAuthn
            FIDO2, plus sûr qu'un simple mot de passe.
          </p>
        </div>
      </div>

      {/* Info Dialog */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Types de biométrie supportés
            </DialogTitle>
            <DialogDescription>
              SentinelMFA supporte tous les mécanismes biométriques du standard WebAuthn / FIDO2.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {(Object.entries(biometricInfo) as [BiometricType, (typeof biometricInfo)[BiometricType]][]).map(
              ([key, info]) => (
                <div key={key} className="flex gap-4 items-start">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${info.color}`}
                  >
                    <info.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{info.label}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {info.desc}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
          <div className="rounded-lg bg-accent/40 p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              La biométrie est liée à votre appareil et n'est jamais envoyée
              sur nos serveurs. Seule une clé publique cryptographique est
              stockée, conformément au standard FIDO2.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
