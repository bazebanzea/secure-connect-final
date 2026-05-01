// supabase/functions/webauthn-auth-start/index.ts
// Génère les options d'authentification WebAuthn (connexion via passkey)
// POST — pas d'authentification requise (c'est le but de cette étape)

import { generateAuthenticationOptions } from "npm:@simplewebauthn/server@13.1.0";
import type { AuthenticatorTransportFuture } from "npm:@simplewebauthn/server@13.1.0";
import { cors, json, err, adminClient, getRpInfo } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return cors();

  try {
    const body = await req.json().catch(() => ({}));
    const email: string | undefined = body.email ?? undefined;

    const { rpID } = getRpInfo(req);
    const sb = adminClient();

    // Si un email est fourni, récupérer les passkeys de cet utilisateur
    let allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] = [];
    let userId: string | undefined;

    if (email) {
      const { data: profile } = await sb
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (profile) {
        userId = profile.id;
        const { data: keys } = await sb
          .from("passkeys")
          .select("credential_id, transports")
          .eq("user_id", profile.id);

        allowCredentials = (keys ?? []).map((k) => ({
          id: k.credential_id as string,
          transports: (k.transports ?? undefined) as
            | AuthenticatorTransportFuture[]
            | undefined,
        }));
      }
    }

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "preferred",
      allowCredentials: allowCredentials.length ? allowCredentials : undefined,
    });

    // Stocker le challenge
    await sb.from("webauthn_challenges").insert({
      challenge: options.challenge,
      type: "authentication",
      user_id: userId ?? null,
      email: email ?? null,
    });

    return json(options);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erreur interne";
    return err(message);
  }
});
