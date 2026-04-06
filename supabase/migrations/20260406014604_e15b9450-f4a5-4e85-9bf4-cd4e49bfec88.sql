
-- Password reset requests table
CREATE TABLE public.password_reset_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Users can read their own requests
CREATE POLICY "Users can read own reset requests"
  ON public.password_reset_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own requests
CREATE POLICY "Users can submit reset requests"
  ON public.password_reset_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
