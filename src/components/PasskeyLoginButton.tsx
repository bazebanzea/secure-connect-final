import { useEffect, useState } from "react";
import { startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import { Fingerprint, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  startPasskeyAuthentication,
  finishPasskeyAuthentication,
} from "@/server/passkeys.functions";

export function PasskeyLoginButton({
  email,
  onSuccess,
}: {
  email?: string;
  onSuccess: () => void;
}) {
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
  }, []);

  if (!supported) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      const options = await startPasskeyAuthentication({ data: { email: email || undefined } });
      const assertion = await startAuthentication({
        optionsJSON: options as unknown as PublicKeyCredentialRequestOptionsJSON,
      });
      const result = await finishPasskeyAuthentication({ data: { response: assertion } });

      // Establish a Supabase session via the magic link's hashed token
      const { error } = await supabase.auth.verifyOtp({
        type: "magiclink",
        email: result.email,
        token_hash: result.hashedToken,
      });
      if (error) throw error;

      toast.success("Connexion réussie");
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      if (!msg.toLowerCase().includes("cancel") && !msg.toLowerCase().includes("abort")) {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={loading}
      className="w-full"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
      Se connecter avec Face ID / Touch ID
    </Button>
  );
}
