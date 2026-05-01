// supabase/functions/_shared/utils.ts
// Utilitaires partagés entre toutes les Edge Functions

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── CORS ─────────────────────────────────────────────────────────────────

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export const cors = () => new Response(null, { headers: CORS });

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

export const err = (message: string, status = 400) =>
  json({ error: message }, status);

// ─── Supabase clients ─────────────────────────────────────────────────────

/** Client service_role — bypass RLS, pour les opérations admin */
export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );
}

/** Client user-scoped — respects RLS */
export function userClient(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    }
  );
}

// ─── Auth helper ─────────────────────────────────────────────────────────

export async function requireAuth(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) throw new Error("Non authentifié");
  const sb = userClient(auth);
  const {
    data: { user },
    error,
  } = await sb.auth.getUser();
  if (error || !user) throw new Error("Token invalide");
  return { user, auth };
}

// ─── RP Info (WebAuthn Relying Party) ────────────────────────────────────

export function getRpInfo(req: Request) {
  // Priorité : variables d'env → header Origin → fallback localhost
  const envRpId = Deno.env.get("WEBAUTHN_RP_ID");
  const envOrigin = Deno.env.get("WEBAUTHN_ORIGIN");
  const envRpName = Deno.env.get("WEBAUTHN_RP_NAME") ?? "SentinelMFA";

  if (envRpId && envOrigin) {
    return { rpID: envRpId, origin: envOrigin, rpName: envRpName };
  }

  // Auto-detect depuis l'Origin de la requête
  const originHeader = req.headers.get("origin") ?? "http://localhost:5173";
  const url = new URL(originHeader);
  const rpID = url.hostname; // sans port
  const origin = originHeader; // avec port si présent
  return { rpID, origin, rpName: envRpName };
}
