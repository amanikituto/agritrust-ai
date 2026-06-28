
-- Extend farmer_profiles with AFRACA alternative-data fields
ALTER TABLE public.farmer_profiles
  ADD COLUMN IF NOT EXISTS primary_language text,
  ADD COLUMN IF NOT EXISTS years_farming integer,
  ADD COLUMN IF NOT EXISTS land_ownership text,
  ADD COLUMN IF NOT EXISTS primary_decision_maker boolean,
  ADD COLUMN IF NOT EXISTS controls_income boolean,
  ADD COLUMN IF NOT EXISTS owns_phone boolean,
  ADD COLUMN IF NOT EXISTS uses_mobile_money boolean,
  ADD COLUMN IF NOT EXISTS in_women_group boolean,
  ADD COLUMN IF NOT EXISTS in_youth_group boolean,
  ADD COLUMN IF NOT EXISTS in_disability_group boolean,
  ADD COLUMN IF NOT EXISTS faces_credit_barriers boolean,
  ADD COLUMN IF NOT EXISTS inclusion_notes text,
  ADD COLUMN IF NOT EXISTS irrigation boolean,
  ADD COLUMN IF NOT EXISTS storage text,
  ADD COLUMN IF NOT EXISTS mechanization text,
  ADD COLUMN IF NOT EXISTS input_suppliers text[],
  ADD COLUMN IF NOT EXISTS main_buyers text[],
  ADD COLUMN IF NOT EXISTS production_estimate text,
  ADD COLUMN IF NOT EXISTS savings_method text,
  ADD COLUMN IF NOT EXISTS has_insurance boolean,
  ADD COLUMN IF NOT EXISTS climate_risks text[],
  ADD COLUMN IF NOT EXISTS adaptation_practices text[],
  ADD COLUMN IF NOT EXISTS water_access text,
  ADD COLUMN IF NOT EXISTS coop_years integer,
  ADD COLUMN IF NOT EXISTS coop_role text,
  ADD COLUMN IF NOT EXISTS peer_guarantee boolean,
  ADD COLUMN IF NOT EXISTS extension_visits_per_year integer,
  ADD COLUMN IF NOT EXISTS consent_data_use boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS intake_completed boolean DEFAULT false;

-- Loan application source (web/ussd/agent)
ALTER TABLE public.loan_applications
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'web';

-- Extend loan_status enum with finer decisions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'approved_with_conditions' AND enumtypid = 'loan_status'::regtype) THEN
    ALTER TYPE loan_status ADD VALUE 'approved_with_conditions';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'needs_info' AND enumtypid = 'loan_status'::regtype) THEN
    ALTER TYPE loan_status ADD VALUE 'needs_info';
  END IF;
END $$;

-- farm_records — alternative-data updates from farmers
CREATE TABLE IF NOT EXISTS public.farm_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  record_type text NOT NULL,
  amount_kes numeric,
  quantity numeric,
  unit text,
  counterparty text,
  notes text,
  occurred_on date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS farm_records_farmer_idx ON public.farm_records (farmer_id, occurred_on DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.farm_records TO authenticated;
GRANT ALL ON public.farm_records TO service_role;

ALTER TABLE public.farm_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farm records: self read" ON public.farm_records;
CREATE POLICY "Farm records: self read" ON public.farm_records FOR SELECT TO authenticated USING (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "Farm records: self write" ON public.farm_records;
CREATE POLICY "Farm records: self write" ON public.farm_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "Farm records: self update" ON public.farm_records;
CREATE POLICY "Farm records: self update" ON public.farm_records FOR UPDATE TO authenticated USING (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "Farm records: self delete" ON public.farm_records;
CREATE POLICY "Farm records: self delete" ON public.farm_records FOR DELETE TO authenticated USING (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "Farm records: lenders read" ON public.farm_records;
CREATE POLICY "Farm records: lenders read" ON public.farm_records FOR SELECT TO authenticated USING (is_lender_staff(auth.uid()));
