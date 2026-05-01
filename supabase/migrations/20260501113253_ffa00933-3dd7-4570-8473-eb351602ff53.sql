
-- Restrictive policy: free users limited to 1 bot
CREATE POLICY "Free plan bot limit"
ON public.bots
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    -- Premium users: unlimited
    EXISTS (
      SELECT 1 FROM public.user_plans up
      WHERE up.user_id = auth.uid()
        AND up.plan_status = 'premium'
    )
    -- Admins bypass
    OR public.has_role(auth.uid(), 'admin')
    -- Free users: only if they have 0 bots
    OR (
      (SELECT count(*) FROM public.bots b WHERE b.user_id = auth.uid()) = 0
    )
  )
);
