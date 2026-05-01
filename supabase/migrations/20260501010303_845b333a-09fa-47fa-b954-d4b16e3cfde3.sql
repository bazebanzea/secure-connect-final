-- Passkeys (WebAuthn credentials) table
CREATE TABLE public.passkeys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  transports TEXT[],
  device_name TEXT NOT NULL,
  backed_up BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_passkeys_user_id ON public.passkeys(user_id);
CREATE INDEX idx_passkeys_credential_id ON public.passkeys(credential_id);

ALTER TABLE public.passkeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own passkeys" ON public.passkeys
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own passkeys" ON public.passkeys
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own passkeys" ON public.passkeys
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own passkeys" ON public.passkeys
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- WebAuthn challenges (short-lived, used during register/login ceremonies)
CREATE TABLE public.webauthn_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge TEXT NOT NULL UNIQUE,
  user_id UUID,
  email TEXT,
  type TEXT NOT NULL CHECK (type IN ('registration', 'authentication')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '5 minutes')
);

CREATE INDEX idx_webauthn_challenges_challenge ON public.webauthn_challenges(challenge);

-- Server-only table; no RLS policies needed since accessed only via service role
ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;