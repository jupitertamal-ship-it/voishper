
-- 1. Fix user_plans INSERT policy to enforce plan_status='free'
DROP POLICY IF EXISTS "Users can insert own plan" ON public.user_plans;
CREATE POLICY "Users can insert own plan"
  ON public.user_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND plan_status = 'free'
    AND is_banned = false
    AND scrape_count = 0
    AND message_count = 0
  );

-- 2. Create a public bot config view (safe columns only) and drop the wide-open public read policy
DROP POLICY IF EXISTS "Public can read bot config" ON public.bots;

CREATE OR REPLACE VIEW public.public_bot_config
  WITH (security_invoker = false)
AS
  SELECT id, name, greeting_message, colors, website_url, domain_whitelist
  FROM public.bots;

-- Grant anon and authenticated access to the view
GRANT SELECT ON public.public_bot_config TO anon, authenticated;

-- 3. Add leads validation trigger for email format and field lengths
CREATE OR REPLACE FUNCTION public.validate_lead_input()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Name must be 100 characters or fewer';
  END IF;
  IF length(NEW.email) > 255 THEN
    RAISE EXCEPTION 'Email must be 255 characters or fewer';
  END IF;
  IF NEW.email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  IF NEW.chat_transcript IS NOT NULL AND length(NEW.chat_transcript) > 50000 THEN
    RAISE EXCEPTION 'Chat transcript too long';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_lead_before_insert
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lead_input();
