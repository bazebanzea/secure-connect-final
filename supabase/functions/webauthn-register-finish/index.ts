// supabase/functions/webauthn-register-finish/index.ts
// Vérifie l'attestation et sauvegarde la passkey en base
// POST — authentification requise

import {
  verifyRegistrationResponse,
} from "npm:@simplewebauthn/server@13.1.0";
import type { RegistrationResponseJSON } from "npm:@simplewebauthn/server@13.1.0";
import { cors, json, err, requireAuth, adminClient, getRpInfo } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return cors();

  try {
    const { user } = await requireAuth(req);
    const body = await req.json();
    const { deviceLabel, response: attResp } = body as {
      deviceLabel: string;
      response: RegistrationResponseJSON;
    };

    if (!attResp) return err("response requis");
    if (!deviceLabel) return err("deviceLabel requis");

    const { rpID, origin } = getRpInfo(req);
    const sb = adminClient();

    // Extraire le challenge de la réponse client
    const clientData = JSON.parse(
      atob(attResp.response.clientDataJSON.replace(/-/g, "+").replace(/_/g, "/"))
    );
    const clientChallenge = clientData.challenge as string;

    // Récupérer et consommer le challenge
    const { data: challengeRow, error: challengeErr } = await sb
      .from("webauthn_challenges")
      .select("*")
      .eq("challenge", clientChallenge)
      .eq("type", "registration")
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (challengeErr || !challengeRow) {
      return err("Challenge introuvable ou expiré", 400);
    }

    // Supprimer le challenge (usage unique)
    await sb.from("webauthn_challenges").delete().eq("id", challengeRow.id);

    // Vérifier l'attestation
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: attResp,
        expectedChallenge: challengeRow.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: false,
      });
    } catch (e) {
      return err(`Vérification échouée: ${(e as Error).message}`, 400);
    }

    if (!verification.verified || !verification.registrationInfo) {
      return err("Attestation invalide", 401);
    }

    const { credential, credentialBackedUp } = verification.registrationInfo;

    // Sauvegarder la passkey
    const { error: insertErr } = await sb.from("passkeys").insert({
      user_id: user.id,
      credential_id: credential.id,
      public_key: btoa(String.fromCharCode(...credential.publicKey)),
      counter: credential.counter,
      transports: credential.transports ?? null,
      device_name: deviceLabel.slice(0, 80),
      backed_up: credentialBackedUp,
    });

    if (insertErr) throw new Error(`Sauvegarde impossible: ${insertErr.message}`);

    return json({ verified: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erreur interne";
    const status = message.includes("authentifi") ? 401 : 400;
    return err(message, status);
  }
});
