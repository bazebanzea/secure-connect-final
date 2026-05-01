import { useEffect, useState } from "react";
import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import { Loader2, Smartphone, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  onComplete: () => void;
};

type Step = "name" | "scan" | "verify" | "done";

export function EnrollTotpDialog({ open, onOpenChange, userEmail, onComplete }: Props) {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [secret, setSecret] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep("name");
      setName("");
      setSecret("");
      setQrDataUrl("");
      setFactorId(null);
      setCode("");
    }
  }, [open]);

  const handleStartEnrollment = async () => {
    if (!name.trim()) {
      toast.error("Donnez un nom à ce facteur");
      return;
    }
    setLoading(true);
    try {
      const newSecret = generateSecret();
      const otpauth = generateURI({ issuer: "SentinelMFA", label: userEmail, secret: newSecret });
      const dataUrl = await QRCode.toDataURL(otpauth, { width: 240, margin: 1 });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("mfa_factors")
        .insert({
          user_id: user.id,
          friendly_name: name.trim(),
          secret: newSecret,
          factor_type: "totp",
        })
        .select("id")
        .single();
      if (error) throw error;

      setSecret(newSecret);
      setQrDataUrl(dataUrl);
      setFactorId(data.id);
      setStep("scan");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6 || !factorId) return;
    setLoading(true);
    try {
      const result = verifySync({ token: code, secret });
      const isValid = result.valid;
      if (!isValid) {
        toast.error("Code invalide. Vérifiez l'heure de votre appareil.");
        setLoading(false);
        return;
      }
      const { error } = await supabase
        .from("mfa_factors")
        .update({ verified: true, verified_at: new Date().toISOString() })
        .eq("id", factorId);
      if (error) throw error;
      setStep("done");
      toast.success("Facteur MFA activé");
      setTimeout(onComplete, 1200);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Enrôler un facteur TOTP
          </DialogTitle>
          <DialogDescription>
            {step === "name" && "Donnez un nom à votre nouvel appareil."}
            {step === "scan" && "Scannez le QR code avec votre application d'authentification."}
            {step === "verify" && "Saisissez le code à 6 chiffres affiché par votre application."}
            {step === "done" && "Facteur activé avec succès."}
          </DialogDescription>
        </DialogHeader>

        {step === "name" && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="factor-name">Nom du facteur</Label>
              <Input
                id="factor-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="iPhone professionnel"
                autoFocus
              />
            </div>
          </div>
        )}

        {step === "scan" && (
          <div className="space-y-4 py-2">
            <div className="flex justify-center rounded-xl border bg-white p-4">
              {qrDataUrl && <img src={qrDataUrl} alt="QR code MFA" width={240} height={240} />}
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Ou saisissez ce code manuellement
              </Label>
              <code className="block break-all rounded-md bg-muted p-3 text-xs font-mono">
                {secret}
              </code>
            </div>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4 py-2">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="font-medium">Activé !</p>
          </div>
        )}

        <DialogFooter>
          {step === "name" && (
            <Button
              onClick={handleStartEnrollment}
              disabled={loading}
              className="w-full bg-[image:var(--gradient-primary)]"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Continuer
            </Button>
          )}
          {step === "scan" && (
            <Button
              onClick={() => setStep("verify")}
              className="w-full bg-[image:var(--gradient-primary)]"
            >
              J'ai scanné, vérifier
            </Button>
          )}
          {step === "verify" && (
            <Button
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
              className="w-full bg-[image:var(--gradient-primary)]"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Vérifier et activer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
