
-- 1. Tighten leads INSERT policy: block direct anon/authenticated inserts.
-- Lead capture must go through the secure 'chat' edge function (service_role),
-- which already validates ownership and rate-limits by IP.
DROP POLICY IF EXISTS "Widget can insert leads" ON public.leads;

CREATE POLICY "Block direct lead inserts"
ON public.leads
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

-- 2. Password reset requests: ensure user_email matches the JWT email.
DROP POLICY IF EXISTS "Users can submit reset requests" ON public.password_reset_requests;

CREATE POLICY "Users can submit reset requests"
ON public.password_reset_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);
