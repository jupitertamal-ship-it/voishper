-- Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated where unsafe.
-- handle_new_user is a trigger function — revoke from all non-superusers.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- update_updated_at_column is a trigger function — revoke direct execution.
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- validate_lead_input is a trigger function — revoke direct execution.
REVOKE ALL ON FUNCTION public.validate_lead_input() FROM PUBLIC, anon, authenticated;

-- has_role is used in RLS policies; restrict direct execution to authenticated users only.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- get_bot_config is intentionally public (used by widget). Keep accessible to anon and authenticated.
REVOKE ALL ON FUNCTION public.get_bot_config(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_bot_config(uuid) TO anon, authenticated;

-- Add an explicit restrictive UPDATE policy on user_plans to guarantee no one can ever
-- escalate plan_status, unban, or zero out usage counters by bypassing absent policies.
-- Currently no UPDATE policy exists, so all updates are denied — but a restrictive policy
-- adds defense-in-depth: even if a permissive UPDATE policy is later added by mistake,
-- this policy will still block forbidden field changes.
CREATE POLICY "Block direct user updates to plan fields"
ON public.user_plans
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

-- Add an explicit restrictive INSERT policy on conversations for non-service-role callers.
-- The widget inserts conversations via the chat edge function (service role), which
-- bypasses RLS. Authenticated/anon users should NEVER directly insert conversation rows.
CREATE POLICY "Block direct conversation inserts"
ON public.conversations
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (false);