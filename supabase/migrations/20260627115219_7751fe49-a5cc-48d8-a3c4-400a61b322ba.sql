
-- =====================================================
-- ENUMS
-- =====================================================
CREATE TYPE public.app_role AS ENUM (
  'farmer',
  'loan_officer',
  'credit_manager',
  'institution_admin',
  'system_admin'
);

CREATE TYPE public.gender_type AS ENUM (
  'male',
  'female',
  'non_binary',
  'prefer_not_to_say'
);

CREATE TYPE public.institution_type AS ENUM (
  'bank',
  'sacco',
  'mfi',
  'cooperative',
  'ngo',
  'government'
);

CREATE TYPE public.loan_status AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'disbursed',
  'repaid',
  'defaulted'
);

CREATE TYPE public.notification_type AS ENUM (
  'rain_alert',
  'loan_approval',
  'loan_rejection',
  'repayment_reminder',
  'training',
  'insurance',
  'recommendation',
  'system'
);

-- =====================================================
-- profiles
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'en',
  preferred_contact_method TEXT DEFAULT 'app',
  account_type TEXT NOT NULL DEFAULT 'farmer' CHECK (account_type IN ('farmer','lender')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles: read own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles: update own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles: insert own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- =====================================================
-- user_roles + has_role()
-- =====================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User roles: read own" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_lender_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('loan_officer','credit_manager','institution_admin','system_admin')
  )
$$;

-- System-admin-only role management
CREATE POLICY "User roles: admin manage" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'system_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'system_admin'));

-- =====================================================
-- farmer_profiles
-- =====================================================
CREATE TABLE public.farmer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  national_id TEXT,
  gender public.gender_type,
  date_of_birth DATE,
  county TEXT,
  sub_county TEXT,
  ward TEXT,
  cooperative TEXT,
  farm_size_acres NUMERIC,
  crops TEXT[] DEFAULT '{}',
  livestock TEXT[] DEFAULT '{}',
  mobile_money_provider TEXT,
  has_disability BOOLEAN DEFAULT false,
  disability_details TEXT,
  household_size INT,
  is_youth BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.farmer_profiles TO authenticated;
GRANT ALL ON public.farmer_profiles TO service_role;
ALTER TABLE public.farmer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmer profiles: self read" ON public.farmer_profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Farmer profiles: self upsert" ON public.farmer_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Farmer profiles: self update" ON public.farmer_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Farmer profiles: lenders read all" ON public.farmer_profiles
  FOR SELECT TO authenticated USING (public.is_lender_staff(auth.uid()));

-- =====================================================
-- lender_profiles
-- =====================================================
CREATE TABLE public.lender_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_name TEXT NOT NULL,
  branch TEXT,
  institution_type public.institution_type NOT NULL DEFAULT 'bank',
  regulatory_license TEXT,
  contact_person TEXT,
  institution_size TEXT,
  staff_role public.app_role NOT NULL DEFAULT 'loan_officer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lender_profiles TO authenticated;
GRANT ALL ON public.lender_profiles TO service_role;
ALTER TABLE public.lender_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lender profiles: self read" ON public.lender_profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Lender profiles: self upsert" ON public.lender_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Lender profiles: self update" ON public.lender_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Lender profiles: lender peers read" ON public.lender_profiles
  FOR SELECT TO authenticated USING (public.is_lender_staff(auth.uid()));

-- =====================================================
-- trust_scores
-- =====================================================
CREATE TABLE public.trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  credit_readiness INT NOT NULL DEFAULT 0,
  climate_risk TEXT NOT NULL DEFAULT 'medium',
  loan_eligibility_kes NUMERIC DEFAULT 0,
  components JSONB DEFAULT '{}'::jsonb,
  top_positive_factors TEXT[] DEFAULT '{}',
  top_negative_factors TEXT[] DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX trust_scores_farmer_idx ON public.trust_scores(farmer_id, computed_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trust_scores TO authenticated;
GRANT ALL ON public.trust_scores TO service_role;
ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trust scores: farmer reads own" ON public.trust_scores
  FOR SELECT TO authenticated USING (auth.uid() = farmer_id);
CREATE POLICY "Trust scores: lenders read all" ON public.trust_scores
  FOR SELECT TO authenticated USING (public.is_lender_staff(auth.uid()));

-- =====================================================
-- loan_applications
-- =====================================================
CREATE TABLE public.loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_kes NUMERIC NOT NULL,
  purpose TEXT,
  term_months INT NOT NULL DEFAULT 12,
  status public.loan_status NOT NULL DEFAULT 'submitted',
  ai_recommendation TEXT,
  ai_confidence NUMERIC,
  trust_score_snapshot INT,
  climate_risk_snapshot TEXT,
  top_positive_factors TEXT[] DEFAULT '{}',
  top_negative_factors TEXT[] DEFAULT '{}',
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX loan_applications_farmer_idx ON public.loan_applications(farmer_id, created_at DESC);
CREATE INDEX loan_applications_status_idx ON public.loan_applications(status, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.loan_applications TO authenticated;
GRANT ALL ON public.loan_applications TO service_role;
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Loans: farmer reads own" ON public.loan_applications
  FOR SELECT TO authenticated USING (auth.uid() = farmer_id);
CREATE POLICY "Loans: farmer creates own" ON public.loan_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "Loans: farmer updates own draft" ON public.loan_applications
  FOR UPDATE TO authenticated USING (auth.uid() = farmer_id AND status IN ('draft','submitted'));
CREATE POLICY "Loans: lenders read all" ON public.loan_applications
  FOR SELECT TO authenticated USING (public.is_lender_staff(auth.uid()));
CREATE POLICY "Loans: lenders update" ON public.loan_applications
  FOR UPDATE TO authenticated USING (public.is_lender_staff(auth.uid()));

-- =====================================================
-- notifications
-- =====================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications: own read" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Notifications: own update" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- =====================================================
-- updated_at trigger
-- =====================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_farmer_profiles_updated BEFORE UPDATE ON public.farmer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_lender_profiles_updated BEFORE UPDATE ON public.lender_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_loan_applications_updated BEFORE UPDATE ON public.loan_applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================================================
-- New-user trigger: create profile + default role from metadata
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_type TEXT := COALESCE(NEW.raw_user_meta_data->>'account_type', 'farmer');
  v_full_name    TEXT := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  v_phone        TEXT := NEW.phone;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, account_type)
  VALUES (NEW.id, v_full_name, NEW.email, v_phone, v_account_type)
  ON CONFLICT (id) DO NOTHING;

  IF v_account_type = 'lender' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'loan_officer')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'farmer')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
