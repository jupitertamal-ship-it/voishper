
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- 3. user_plans table
CREATE TABLE public.user_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_status text NOT NULL DEFAULT 'free',
  is_banned boolean NOT NULL DEFAULT false,
  scrape_count integer NOT NULL DEFAULT 0,
  message_count integer NOT NULL DEFAULT 0,
  message_reset_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own plan" ON public.user_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plan" ON public.user_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 4. payment_submissions table
CREATE TABLE public.payment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email text NOT NULL,
  payment_number text NOT NULL,
  transaction_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit payments" ON public.payment_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own payments" ON public.payment_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 5. Seed admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'plutomuntasir@gmail.com'
ON CONFLICT DO NOTHING;

-- 6. Create plans for all existing users
INSERT INTO public.user_plans (user_id)
SELECT id FROM auth.users
ON CONFLICT DO NOTHING;
