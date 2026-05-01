
-- Track lead submissions per IP for rate limiting
CREATE TABLE IF NOT EXISTS public.lead_submission_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  bot_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_log_ip_time ON public.lead_submission_log(ip_hash, created_at);

ALTER TABLE public.lead_submission_log ENABLE ROW LEVEL SECURITY;
-- No policies = no direct access; only SECURITY DEFINER functions can use it.

-- Secure RPC for lead capture from the widget
CREATE OR REPLACE FUNCTION public.submit_lead(
  _bot_id uuid,
  _name text,
  _email text,
  _chat_transcript text,
  _ip_hash text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _recent_count int;
  _new_id uuid;
BEGIN
  -- Validate bot exists
  IF NOT EXISTS (SELECT 1 FROM public.bots WHERE id = _bot_id) THEN
    RAISE EXCEPTION 'Invalid bot';
  END IF;

  -- Rate limit: max 5 lead submissions per IP per hour
  IF _ip_hash IS NOT NULL AND length(_ip_hash) > 0 THEN
    SELECT count(*) INTO _recent_count
      FROM public.lead_submission_log
     WHERE ip_hash = _ip_hash
       AND created_at > now() - interval '1 hour';
    IF _recent_count >= 5 THEN
      RAISE EXCEPTION 'Rate limit exceeded';
    END IF;

    INSERT INTO public.lead_submission_log(ip_hash, bot_id) VALUES (_ip_hash, _bot_id);
  END IF;

  INSERT INTO public.leads(bot_id, name, email, chat_transcript)
  VALUES (_bot_id, _name, _email, _chat_transcript)
  RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_lead(uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_lead(uuid, text, text, text, text) TO anon, authenticated;
