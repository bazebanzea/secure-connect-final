import { Smartphone, Fingerprint, ScanFace, KeyRound, QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type MfaChoice = "totp" | "passkey" | "authenticator";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChoice: (choice: MfaChoice) => void;
};

const options: {
  id: MfaChoice;
  icon: typeof Smartphone;
  title: string;
  desc: string;
  badge?: string;
  color: string;
}[] = [
  {
    id: "totp",
    icon: Smartphone,
    title: "TOTP (Code temporaire)",
    desc: "Génère un code à 6 chiffres toutes les 30s. Compatible Google Authenticator, Authy, 1Password.",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    id: "passkey",
    icon: Fingerprint,
    title: "Passkey / Biométrie",
    desc: "Face ID, Touch ID, Windows Hello ou clé de sécurité USB. Standard FIDO2 / WebAuthn.",
    badge: "Recommandé",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    id: "authenticator",
    icon: QrCode,
    title: "Authenticator intégré",
    desc: "Utilisez SentinelMFA comme votre application d'authentification pour vos autres comptes.",
    badge: "Nouveau",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
];

export function AddMfaDialog({ open, onOpenChange, onChoice }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Ajouter un facteur d'authentification
          </DialogTitle>
          <DialogDescription>
            Choisissez le type de facteur MFA à configurer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                onOpenChange(false);
                onChoice(opt.id);
              }}
              className="w-full flex items-start gap-4 rounded-xl border p-4 text-left hover:border-primary/30 hover:bg-accent/30 transition-all group cursor-pointer"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-lg shrink-0 ${opt.color} group-hover:scale-105 transition-transform`}
              >
                <opt.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{opt.title}</p>
                  {opt.badge && (
                    <span className="inline-flex items-center rounded-full bg-[image:var(--gradient-primary)] px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      {opt.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {opt.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
