
-- Extend notification_type enum
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'data_sold';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'data_purchased';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'trust_score_update';

-- ============ ENUMS ============
DO $$ BEGIN CREATE TYPE public.purchase_status AS ENUM ('pending','active','expired','revoked','refunded'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.consent_scope AS ENUM ('one_off','pre_authorized'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============ DATA MARKETPLACE ============
CREATE TABLE IF NOT EXISTS public.data_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_type text NOT NULL,
  title text NOT NULL,
  description text,
  price_kes numeric(12,2) NOT NULL CHECK (price_kes >= 0),
  refresh_cadence text DEFAULT 'monthly',
  sample jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_products TO authenticated;
GRANT ALL ON public.data_products TO service_role;
ALTER TABLE public.data_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "farmer manages own products" ON public.data_products FOR ALL TO authenticated USING (auth.uid() = farmer_id) WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "lenders browse active products" ON public.data_products FOR SELECT TO authenticated USING (is_active AND public.is_lender_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.data_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.data_products(id) ON DELETE RESTRICT,
  lender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farmer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_kes numeric(12,2) NOT NULL,
  status public.purchase_status NOT NULL DEFAULT 'pending',
  access_token text UNIQUE,
  expires_at timestamptz,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_purchases TO authenticated;
GRANT ALL ON public.data_purchases TO service_role;
ALTER TABLE public.data_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lender sees own purchases" ON public.data_purchases FOR SELECT TO authenticated USING (auth.uid() = lender_id);
CREATE POLICY "farmer sees own sales" ON public.data_purchases FOR SELECT TO authenticated USING (auth.uid() = farmer_id);
CREATE POLICY "lender creates purchase" ON public.data_purchases FOR INSERT TO authenticated WITH CHECK (auth.uid() = lender_id AND public.is_lender_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.data_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_type text,
  scope public.consent_scope NOT NULL DEFAULT 'one_off',
  purpose text,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_consents TO authenticated;
GRANT ALL ON public.data_consents TO service_role;
ALTER TABLE public.data_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "farmer manages own consents" ON public.data_consents FOR ALL TO authenticated USING (auth.uid() = farmer_id) WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "lender views own consents" ON public.data_consents FOR SELECT TO authenticated USING (auth.uid() = lender_id);

CREATE TABLE IF NOT EXISTS public.wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_kes numeric(14,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads wallet" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.marketplace_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_id uuid REFERENCES public.data_purchases(id) ON DELETE SET NULL,
  amount_kes numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  rail text NOT NULL DEFAULT 'paystack',
  reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.marketplace_payouts TO authenticated;
GRANT ALL ON public.marketplace_payouts TO service_role;
ALTER TABLE public.marketplace_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "farmer sees own payouts" ON public.marketplace_payouts FOR SELECT TO authenticated USING (auth.uid() = farmer_id);

-- ============ USSD ============
CREATE TABLE IF NOT EXISTS public.ussd_sessions (
  session_id text PRIMARY KEY,
  phone text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  step text NOT NULL DEFAULT 'menu',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ussd_sessions TO service_role;
ALTER TABLE public.ussd_sessions ENABLE ROW LEVEL SECURITY;

-- ============ AUDIT LOG ============
CREATE TABLE IF NOT EXISTS public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_events TO authenticated;
GRANT ALL ON public.audit_events TO service_role;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "actor inserts own event" ON public.audit_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);
CREATE POLICY "lender staff reads audit" ON public.audit_events FOR SELECT TO authenticated USING (public.is_lender_staff(auth.uid()));

-- ============ CLIMATE CACHE ============
CREATE TABLE IF NOT EXISTS public.climate_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  county text NOT NULL,
  week_start date NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (county, week_start)
);
GRANT SELECT ON public.climate_snapshots TO authenticated, anon;
GRANT ALL ON public.climate_snapshots TO service_role;
ALTER TABLE public.climate_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read climate" ON public.climate_snapshots FOR SELECT TO authenticated, anon USING (true);

-- ============ TRIGGERS: updated_at ============
DO $$ BEGIN
  CREATE TRIGGER trg_data_products_updated BEFORE UPDATE ON public.data_products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_data_purchases_updated BEFORE UPDATE ON public.data_purchases FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_wallets_updated BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_ussd_sessions_updated BEFORE UPDATE ON public.ussd_sessions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============ WALLET CREDIT ON PURCHASE ============
CREATE OR REPLACE FUNCTION public.on_purchase_active() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status <> 'active') THEN
    INSERT INTO public.wallets (user_id, balance_kes) VALUES (NEW.farmer_id, NEW.amount_kes)
      ON CONFLICT (user_id) DO UPDATE SET balance_kes = wallets.balance_kes + EXCLUDED.balance_kes, updated_at = now();
    INSERT INTO public.notifications (user_id, type, title, body)
      VALUES (NEW.farmer_id, 'data_sold', 'Data sold', 'Your data product was purchased for KES ' || NEW.amount_kes);
  END IF;
  RETURN NEW;
END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_purchase_active AFTER INSERT OR UPDATE ON public.data_purchases FOR EACH ROW EXECUTE FUNCTION public.on_purchase_active();
EXCEPTION WHEN duplicate_object THEN null; END $$;
