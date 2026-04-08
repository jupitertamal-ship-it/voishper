-- Remove the overly permissive anon SELECT on bots (exposes system_prompt, user_id, etc.)
DROP POLICY IF EXISTS "Anon can read bots for widget" ON public.bots;

-- Drop the security_invoker view (anon can't read bots without a policy)
DROP VIEW IF EXISTS public.public_bot_config;

-- Create a security definer function to return only safe bot config
CREATE OR REPLACE FUNCTION public.get_bot_config(_bot_id uuid)
RETURNS TABLE(id uuid, name text, greeting_message text, colors jsonb, website_url text, domain_whitelist text[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT b.id, b.name, b.greeting_message, b.colors, b.website_url, b.domain_whitelist
  FROM public.bots b
  WHERE b.id = _bot_id;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_bot_config(uuid) TO anon, authenticated;