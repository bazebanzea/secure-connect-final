CREATE POLICY "No direct access to challenges" ON public.webauthn_challenges
  FOR ALL TO authenticated USING (false) WITH CHECK (false);