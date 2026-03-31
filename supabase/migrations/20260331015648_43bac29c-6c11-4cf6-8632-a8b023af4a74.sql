
-- Drop overly permissive policies on cache_responses (only edge functions with service_role access this)
DROP POLICY IF EXISTS "Service can manage cache" ON public.cache_responses;

-- Drop overly permissive INSERT/UPDATE on analytics (only edge functions with service_role access this)
DROP POLICY IF EXISTS "Anyone can update analytics" ON public.analytics;
DROP POLICY IF EXISTS "Anyone can upsert analytics" ON public.analytics;

-- Drop overly permissive INSERT/UPDATE on conversations (only edge functions with service_role access this)
DROP POLICY IF EXISTS "Anyone can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anyone can update conversations" ON public.conversations;

-- Drop duplicate permissive SELECT on bots (keep owner-scoped one)
DROP POLICY IF EXISTS "Public can read bot config" ON public.bots;

-- Re-create bot public read as restricted to only id, name, greeting, colors, system_prompt via RLS
-- Actually we need public read for the widget to fetch bot config, so re-add it
CREATE POLICY "Public can read bot config" ON public.bots
FOR SELECT TO anon, authenticated
USING (true);
