
-- Add new columns to bots table
ALTER TABLE public.bots ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE public.bots ADD COLUMN IF NOT EXISTS domain_whitelist text[] DEFAULT '{}';
ALTER TABLE public.bots ADD COLUMN IF NOT EXISTS whatsapp_number text;

-- Create cache_responses table
CREATE TABLE public.cache_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query_hash text NOT NULL,
  query_text text NOT NULL,
  answer_text text NOT NULL,
  chatbot_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(query_hash, chatbot_id)
);

-- Enable RLS
ALTER TABLE public.cache_responses ENABLE ROW LEVEL SECURITY;

-- Anyone can read cache (needed by edge function with service role)
CREATE POLICY "Service can manage cache" ON public.cache_responses FOR ALL USING (true) WITH CHECK (true);
