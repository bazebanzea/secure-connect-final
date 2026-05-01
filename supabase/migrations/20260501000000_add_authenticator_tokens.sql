-- Authenticator tokens table (for using SentinelMFA as a Google Authenticator replacement)
CREATE TABLE public.authenticator_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issuer TEXT NOT NULL,
  account TEXT NOT NULL DEFAULT '',
  secret TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'SHA1',
  digits INTEGER NOT NULL DEFAULT 6,
  period INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_authenticator_tokens_user_id ON public.authenticator_tokens(user_id);

ALTER TABLE public.authenticator_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own authenticator tokens" ON public.authenticator_tokens
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own authenticator tokens" ON public.authenticator_tokens
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own authenticator tokens" ON public.authenticator_tokens
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own authenticator tokens" ON public.authenticator_tokens
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
