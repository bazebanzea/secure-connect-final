// supabase/functions/webauthn-auth-finish/index.ts
// Vérifie l'assertion WebAuthn et renvoie un magic-link token
// pour établir la session côté client via supabase.auth.verifyOtp()
// POST — pas d'authentification requise

import {
  verifyAuthenticationResponse,
} from "npm:@simplewebauthn/server@13.1.0";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from "npm:@simplewebauthn/server@13.1.0";
import { cors, json, err, adminClient, getRpInfo } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return cors();

  try {
    const body = await req.json();
    const { response: authResp } = body as {
      response: AuthenticationResponseJSON;
    };

    if (!authResp) return err("response requis");

    const { rpID, origin } = getRpInfo(req);
    const sb = adminClient();

    // Extraire le challenge de la réponse client
    const clientData = JSON.parse(
      atob(authResp.response.clientDataJSON.replace(/-/g, "+").replace(/_/g, "/"))
    );
    const clientChallenge = clientData.challenge as string;

    // Récupérer et consommer le challenge
    const { data: challengeRow, error: challengeErr } = await sb
      .from("webauthn_challenges")
      .select("*")
      .eq("challenge", clientChallenge)
      .eq("type", "authentication")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (challengeErr || !challengeRow) {
      return err("Challenge introuvable ou expiré", 400);
    }

    // Supprimer le challenge immédiatement (usage unique)
    await sb.from("webauthn_challenges").delete().eq("id", challengeRow.id);

    // Trouver la passkey par credential_id
    const { data: passkey } = await sb
      .from("passkeys")
      .select("*")
      .eq("credential_id", authResp.id)
      .maybeSingle();

    if (!passkey) return err("Passkey inconnue", 404);

    // Reconstruire la clé publique (stockée en base64)
    const publicKeyBytes = Uint8Array.from(
      atob(passkey.public_key).split("").map((c) => c.charCodeAt(0))
    );

    // Vérifier l'assertion
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: authResp,
        expectedChallenge: challengeRow.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: passkey.credential_id as string,
          publicKey: publicKeyBytes,
          counter: Number(passkey.counter ?? 0),
          transports: (passkey.transports ?? undefined) as
            | AuthenticatorTransportFuture[]
            | undefined,
        },
        requireUserVerification: false,
      });
    } catch (e) {
      return err(`Vérification échouée: ${(e as Error).message}`, 401);
    }

    if (!verification.verified) {
      return err("Assertion invalide", 401);
    }

    // Mettre à jour le counter (anti-replay)
    const newCounter = verification.authenticationInfo?.newCounter ?? Number(passkey.counter ?? 0);
    await sb
      .from("passkeys")
      .update({ counter: newCounter, last_used_at: new Date().toISOString() })
      .eq("id", passkey.id);

    // Récupérer l'email du profil
    const { data: profile } = await sb
      .from("profiles")
      .select("email")
      .eq("id", passkey.user_id)
      .maybeSingle();

    if (!profile?.email) return err("Profil introuvable", 404);

    // Générer un magic link pour établir la session côté client
    const { data: link, error: linkErr } = await sb.auth.admin.generateLink({
      type: "magiclink",
      email: profile.email,
    });
    if (linkErr) throw new Error(`Génération du lien: ${linkErr.message}`);

    return json({
      verified: true,
      email: profile.email,
      hashedToken: link.properties.hashed_token,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erreur interne";
    return err(message);
  }
});
