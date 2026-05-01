// supabase/functions/webauthn-register-start/index.ts
// Génère les options de création de credential WebAuthn (enrôlement passkey)
// POST — authentification requise

import { generateRegistrationOptions } from "npm:@simplewebauthn/server@13.1.0";
import type { AuthenticatorTransportFuture } from "npm:@simplewebauthn/server@13.1.0";
import { cors, json, err, requireAuth, adminClient, getRpInfo } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return cors();

  try {
    // Auth obligatoire
    const { user } = await requireAuth(req);
    const body = await req.json();
    const deviceLabel: string = (body.deviceLabel ?? "Passkey").slice(0, 80);

    const { rpID, rpName } = getRpInfo(req);
    const sb = adminClient();

    // Récupérer les passkeys déjà enregistrées (pour les exclure)
    const { data: existing } = await sb
      .from("passkeys")
      .select("credential_id, transports")
      .eq("user_id", user.id);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new TextEncoder().encode(user.id),
      userName: user.email ?? user.id,
      userDisplayName: user.email ?? user.id,
      attestationType: "none",
      excludeCredentials: (existing ?? []).map((c) => ({
        id: c.credential_id as string,
        transports: (c.transports ?? undefined) as
          | AuthenticatorTransportFuture[]
          | undefined,
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    // Stocker le challenge (TTL 5 min)
    const { error: insertErr } = await sb
      .from("webauthn_challenges")
      .insert({
        challenge: options.challenge,
        type: "registration",
        user_id: user.id,
        email: user.email ?? null,
      });

    if (insertErr) throw new Error("Impossible de sauvegarder le challenge");

    return json({ options, deviceLabel });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erreur interne";
    const status = message.includes("authentifi") ? 401 : 400;
    return err(message, status);
  }
});
