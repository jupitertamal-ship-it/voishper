
-- Add restricted policy for leads INSERT: only allow if bot_id references a valid bot
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
CREATE POLICY "Widget can insert leads" ON public.leads
FOR INSERT TO anon, authenticated
WITH CHECK (EXISTS (SELECT 1 FROM bots WHERE bots.id = leads.bot_id));
