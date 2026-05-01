-- Allow bot owners to delete leads captured by their own bots
CREATE POLICY "Bot owners can delete leads"
ON public.leads
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bots
    WHERE bots.id = leads.bot_id
      AND bots.user_id = auth.uid()
  )
);

-- lead_submission_log: RLS is enabled but had no policies. Explicitly deny all
-- client access (only the SECURITY DEFINER submit_lead function and service_role
-- need to read/write this internal rate-limit table).
CREATE POLICY "Block all client access to submission log"
ON public.lead_submission_log
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);