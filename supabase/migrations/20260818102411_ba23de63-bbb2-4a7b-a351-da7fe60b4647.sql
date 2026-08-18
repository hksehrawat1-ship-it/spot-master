-- 1. Workspace preferences on profiles ---------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS phone_country_code text,
  ADD COLUMN IF NOT EXISTS phone_national_number text,
  ADD COLUMN IF NOT EXISTS working_level text,
  ADD COLUMN IF NOT EXISTS preferred_kits text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS available_products text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS measurement_units text NOT NULL DEFAULT 'metric',
  ADD COLUMN IF NOT EXISTS currency_display text NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS time_zone text,
  ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS setup_step smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS setup_completed_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users read own profile'
  ) THEN
    CREATE POLICY "Users read own profile" ON public.profiles
      FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users insert own profile'
  ) THEN
    CREATE POLICY "Users insert own profile" ON public.profiles
      FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users update own profile'
  ) THEN
    CREATE POLICY "Users update own profile" ON public.profiles
      FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 2. Pricing -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code text NOT NULL UNIQUE,
  plan_name text NOT NULL,
  list_price_minor bigint NOT NULL,
  offer_price_minor bigint NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  access_period_days integer NOT NULL DEFAULT 365,
  tax_rate_percent numeric(5,2) NOT NULL DEFAULT 18.00,
  tax_label text NOT NULL DEFAULT 'GST',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pricing_plans TO anon, authenticated;
GRANT ALL ON public.pricing_plans TO service_role;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active plans" ON public.pricing_plans
  FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "Platform admins manage plans" ON public.pricing_plans
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE TRIGGER trg_pricing_plans_updated BEFORE UPDATE ON public.pricing_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.pricing_plans (plan_code, plan_name, list_price_minor, offer_price_minor, currency, access_period_days)
VALUES ('professional_access', 'Stain Master Professional Access', 1800000, 800000, 'INR', 365)
ON CONFLICT (plan_code) DO NOTHING;

-- 3. Coupons (server-side only) ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL DEFAULT 'fixed',
  discount_value_minor bigint NOT NULL DEFAULT 0,
  discount_percent numeric(5,2),
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  max_redemptions integer,
  redemption_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.coupons TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage coupons" ON public.coupons
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE TRIGGER trg_coupons_updated BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Orders ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_code text NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  list_price_minor bigint NOT NULL,
  offer_price_minor bigint NOT NULL,
  discount_minor bigint NOT NULL DEFAULT 0,
  tax_minor bigint NOT NULL DEFAULT 0,
  total_minor bigint NOT NULL,
  coupon_code text,
  provider text,
  provider_order_id text,
  provider_payment_id text,
  invoice_number text,
  status text NOT NULL DEFAULT 'awaiting_payment',
  paid_at timestamptz,
  access_starts_at timestamptz,
  access_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_status_check CHECK (status IN (
    'awaiting_payment','processing','successful','failed','cancelled',
    'pending_verification','refunded','partially_refunded'
  ))
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_provider_order ON public.orders(provider, provider_order_id)
  WHERE provider_order_id IS NOT NULL;

GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own orders" ON public.orders
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Payment events (append only) --------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  provider text NOT NULL,
  event_type text NOT NULL,
  provider_event_id text,
  signature_verified boolean NOT NULL DEFAULT false,
  is_duplicate boolean NOT NULL DEFAULT false,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_provider_event
  ON public.payment_events(provider, provider_event_id) WHERE provider_event_id IS NOT NULL;

GRANT SELECT ON public.payment_events TO authenticated;
GRANT ALL ON public.payment_events TO service_role;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins read payment events" ON public.payment_events
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));

-- 6. Subscriptions -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_code text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'inactive',
  access_starts_at timestamptz,
  access_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_status_check CHECK (status IN ('inactive','active','expired','cancelled','refunded'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_plan ON public.subscriptions(user_id, plan_code);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own subscription" ON public.subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Server-side entitlement check -------------------------------------------
CREATE OR REPLACE FUNCTION public.has_active_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND (access_ends_at IS NULL OR access_ends_at > now())
  );
$$;