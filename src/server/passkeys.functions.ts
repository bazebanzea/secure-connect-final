// passkeys.functions.ts
// Remplace les createServerFn (Lovable/Cloudflare) par des appels fetch
// vers les Supabase Edge Functions. 100% compatible avec le reste du code.

import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

/** Helper: appelle une Edge Function avec optionnellement le JWT de l'utilisateur */
async function callFn<T = unknown>(
  name: string,
  body: unknown,
  requireAuth = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (requireAuth) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Non authentifié");
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`${FUNCTIONS_BASE}/${name}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `Erreur ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Registration (nécessite une session active) ───────────────────────────

export async function startPasskeyRegistration({
  data,
}: {
  data: { deviceLabel: string };
}) {
  return callFn<{ options: unknown; deviceLabel: string }>(
    "webauthn-register-start",
    { deviceLabel: data.deviceLabel },
    true
  );
}

export async function finishPasskeyRegistration({
  data,
}: {
  data: { deviceLabel: string; response: unknown };
}) {
  return callFn<{ verified: boolean }>(
    "webauthn-register-finish",
    { deviceLabel: data.deviceLabel, response: data.response },
    true
  );
}

// ─── Authentication (pas de session requise) ───────────────────────────────

export async function startPasskeyAuthentication({
  data,
}: {
  data: { email?: string };
}) {
  return callFn<Record<string, unknown>>(
    "webauthn-auth-start",
    { email: data.email ?? null }
  );
}

export async function finishPasskeyAuthentication({
  data,
}: {
  data: { response: unknown };
}) {
  return callFn<{
    verified: boolean;
    email: string;
    hashedToken: string;
  }>("webauthn-auth-finish", { response: data.response });
}
