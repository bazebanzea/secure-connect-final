import { useEffect, useState, useCallback } from "react";
import { startRegistration, browserSupportsWebAuthn, platformAuthenticatorIsAvailable } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Fingerprint, Trash2, Loader2, Plus, ScanFace } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { startPasskeyRegistration, finishPasskeyRegistration } from "@/server/passkeys.functions";

type Passkey = {
  id: string;
  device_name: string;
  created_at: string;
  last_used_at: string | null;
  backed_up: boolean;
};

export function PasskeysSection() {
  const [keys, setKeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [supported, setSupported] = useState(false);
  const [hasPlatform, setHasPlatform] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("passkeys")
      .select("id, device_name, created_at, last_used_at, backed_up")
      .order("created_at", { ascending: false });
    setKeys(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
    platformAuthenticatorIsAvailable().then(setHasPlatform).catch(() => setHasPlatform(false));
    load();
  }, [load]);

  const enroll = async () => {
    if (!label.trim()) {
      toast.error("Donnez un nom à cet appareil");
      return;
    }
    setEnrolling(true);
    try {
      const { options } = await startPasskeyRegistration({ data: { deviceLabel: label.trim() } });
      const attResp = await startRegistration({ optionsJSON: options });
      await finishPasskeyRegistration({ data: { deviceLabel: label.trim(), response: attResp } });
      toast.success("Passkey enregistrée");
      setOpen(false);
      setLabel("");
      load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(msg);
    } finally {
      setEnrolling(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("passkeys").delete().eq("id", id);
    if (error) {
      toast.error("Suppression impossible");
      return;
    }
    toast.success("Passkey supprimée");
    load();
  };

  if (!supported) return null;

  return (
    <div className="rounded-xl border bg-card shadow-[var(--shadow-card)] mt-6">
      <div className="p-6 border-b flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-primary" />
            Passkeys & biométrie
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {hasPlatform ? "Face ID, Touch ID, Windows Hello détecté sur cet appareil." : "Utilisez une clé de sécurité ou un autre appareil."}
          </p>
        </div>
        <Button onClick={() => setOpen(true)} variant="outline" size="sm">
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {loading ? (
        <div className="p-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : keys.length === 0 ? (
        <div className="p-10 text-center">
          <ScanFace className="h-9 w-9 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">Aucune passkey enregistrée</p>
          <p className="text-xs text-muted-foreground mt-1">
            Connectez-vous d'un simple regard la prochaine fois.
          </p>
        </div>
      ) : (
        <ul className="divide-y">
          {keys.map((k) => (
            <li key={k.id} className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Fingerprint className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{k.device_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ajoutée le {new Date(k.created_at).toLocaleDateString("fr-FR")}
                  {k.last_used_at ? ` · dernière utilisation ${new Date(k.last_used_at).toLocaleDateString("fr-FR")}` : ""}
                  {k.backed_up ? " · synchronisée" : ""}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => remove(k.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une passkey</DialogTitle>
            <DialogDescription>
              Votre navigateur va vous demander une vérification (Face ID, Touch ID, code…). Donnez un nom à cet appareil pour le reconnaître.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="device-label">Nom de l'appareil</Label>
            <Input
              id="device-label"
              placeholder="iPhone perso, MacBook Pro…"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={enrolling}
              autoFocus
            />
          </div>
          <Button onClick={enroll} disabled={enrolling} className="w-full bg-[image:var(--gradient-primary)]">
            {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
            Lancer l'enregistrement
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
