-- 1. Remove the overly permissive anon SELECT policy on cache_responses
-- The cache is only read by the chat edge function which uses service_role (bypasses RLS)
DROP POLICY IF EXISTS "Anon can read cache for widget" ON public.cache_responses;

-- 2. Fix public_bot_config view to use SECURITY INVOKER instead of SECURITY DEFINER
-- We need to add a limited anon/authenticated read policy on bots first, then recreate the view
DROP VIEW IF EXISTS public.public_bot_config;

CREATE OR REPLACE VIEW public.public_bot_config
  WITH (security_invoker = true)
AS
  SELECT id, name, greeting_message, colors, website_url, domain_whitelist
  FROM public.bots;

-- Add a read-only policy for anon to read bots (view will filter columns)
CREATE POLICY "Anon can read bots for widget"
  ON public.bots
  FOR SELECT
  TO anon
  USING (true);

GRANT SELECT ON public.public_bot_config TO anon, authenticated;