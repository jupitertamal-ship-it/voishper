
-- 1. Remove public read on knowledge_items (chat function uses service role, doesn't need this)
DROP POLICY IF EXISTS "Public can read knowledge for RAG" ON public.knowledge_items;

-- 2. Add RLS policies for cache_responses (bot owners only)
ALTER TABLE public.cache_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bot owners can manage cache"
ON public.cache_responses
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM bots WHERE bots.id = cache_responses.chatbot_id AND bots.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM bots WHERE bots.id = cache_responses.chatbot_id AND bots.user_id = auth.uid()
));

-- 3. Allow service role (edge functions) to insert/read cache via anon for widget
CREATE POLICY "Anon can read cache for widget"
ON public.cache_responses
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anon can insert cache for widget"
ON public.cache_responses
FOR INSERT
TO anon
WITH CHECK (true);
