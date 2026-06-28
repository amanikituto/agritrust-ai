
-- Drop Masumi / marketplace tables (no longer used)
DROP TABLE IF EXISTS public.marketplace_payouts CASCADE;
DROP TABLE IF EXISTS public.data_purchases CASCADE;
DROP TABLE IF EXISTS public.data_products CASCADE;
DROP TABLE IF EXISTS public.data_consents CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.agent_jobs CASCADE;
DROP FUNCTION IF EXISTS public.on_purchase_active() CASCADE;

-- Allow lender staff to read farmer_profiles for the directory / review screens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='farmer_profiles' AND policyname='Lender staff can read farmer profiles'
  ) THEN
    CREATE POLICY "Lender staff can read farmer profiles"
      ON public.farmer_profiles FOR SELECT
      TO authenticated
      USING (public.is_lender_staff(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='Lender staff can read farmer base profiles'
  ) THEN
    CREATE POLICY "Lender staff can read farmer base profiles"
      ON public.profiles FOR SELECT
      TO authenticated
      USING (public.is_lender_staff(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='trust_scores' AND policyname='Lender staff can read trust scores'
  ) THEN
    CREATE POLICY "Lender staff can read trust scores"
      ON public.trust_scores FOR SELECT
      TO authenticated
      USING (public.is_lender_staff(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='farm_records' AND policyname='Lender staff can read farm records'
  ) THEN
    CREATE POLICY "Lender staff can read farm records"
      ON public.farm_records FOR SELECT
      TO authenticated
      USING (public.is_lender_staff(auth.uid()));
  END IF;
END $$;

-- Seed six Kenyan demo farmers (idempotent). Auth users use deterministic UUIDs.
DO $$
DECLARE
  demo RECORD;
BEGIN
  FOR demo IN
    SELECT * FROM (VALUES
      ('11111111-1111-1111-1111-111111111101'::uuid, 'Mary Wanjiku',  '+254700111001', 'Nakuru',     'female', 'Wanjiku Maize SACCO', ARRAY['maize','beans'], 2.5, false, true,  true,  false, true,  true,  false, false),
      ('11111111-1111-1111-1111-111111111102'::uuid, 'Brian Otieno',  '+254700111002', 'Kisumu',     'male',   'Lake Horticulture Coop', ARRAY['tomato','kale'], 1.2, true,  true,  true,  true,  false, false, false, false),
      ('11111111-1111-1111-1111-111111111103'::uuid, 'Aisha Mohamed', '+254700111003', 'Garissa',    'female', 'Tana Dairy Group', ARRAY['dairy','goats'], 3.0, false, true,  true,  false, true,  true,  false, false),
      ('11111111-1111-1111-1111-111111111104'::uuid, 'Peter Mwangi',  '+254700111004', 'Murang''a',  'male',   'Murang''a Coffee Coop', ARRAY['coffee','bananas','maize'], 4.5, true,  true,  true,  false, false, false, false, false),
      ('11111111-1111-1111-1111-111111111105'::uuid, 'Grace Naliaka', '+254700111005', 'Bungoma',    'female', 'Bungoma Women in Agriculture', ARRAY['maize','sugarcane'], 1.8, false, true,  true,  false, true,  false, true,  true),
      ('11111111-1111-1111-1111-111111111106'::uuid, 'Joseph Kiptoo', '+254700111006', 'Uasin Gishu','male',   'Eldoret Grain Coop', ARRAY['maize','dairy'], 6.0, true,  true,  true,  false, false, false, false, false)
    ) AS t(uid, full_name, phone, county, gender, coop, crops, acres, irrigation, uses_mm, owns_phone, is_youth, in_women, has_insurance, in_disability_group, has_disability)
  LOOP
    -- Create auth user (idempotent) so foreign key from profiles is satisfied
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = demo.uid) THEN
      INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
      VALUES (
        demo.uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'demo+' || replace(lower(demo.full_name), ' ', '.') || '@agritrust.test',
        crypt('disabled-demo', gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"seed","providers":["seed"]}'::jsonb,
        jsonb_build_object('full_name', demo.full_name, 'account_type','farmer')
      );
    END IF;

    INSERT INTO public.profiles (id, full_name, phone, account_type, preferred_language)
    VALUES (demo.uid, demo.full_name, demo.phone, 'farmer', 'en')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (demo.uid, 'farmer')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.farmer_profiles (
      id, county, gender, cooperative, crops, farm_size_acres, irrigation,
      uses_mobile_money, mobile_money_provider, owns_phone, is_youth,
      in_women_group, in_disability_group, has_disability, has_insurance,
      savings_method, coop_years, peer_guarantee, years_farming,
      primary_decision_maker, controls_income, land_ownership,
      intake_completed, water_access, adaptation_practices
    )
    VALUES (
      demo.uid, demo.county, demo.gender::gender_type, demo.coop, demo.crops, demo.acres, demo.irrigation,
      demo.uses_mm, CASE WHEN demo.uses_mm THEN 'mpesa' ELSE NULL END, demo.owns_phone, demo.is_youth,
      demo.in_women, demo.in_disability_group, demo.has_disability, demo.has_insurance,
      'sacco', 3, true, 6,
      true, true, 'family',
      true, CASE WHEN demo.irrigation THEN 'reliable' ELSE 'seasonal' END,
      ARRAY['cover_crops','crop_rotation']
    )
    ON CONFLICT (id) DO UPDATE SET
      county = EXCLUDED.county, cooperative = EXCLUDED.cooperative, crops = EXCLUDED.crops,
      farm_size_acres = EXCLUDED.farm_size_acres, intake_completed = true;
  END LOOP;
END $$;

-- Seed farm records & loans for richer demo data (idempotent on record_type+date)
INSERT INTO public.farm_records (farmer_id, record_type, amount_kes, occurred_on, notes)
SELECT * FROM (VALUES
  ('11111111-1111-1111-1111-111111111101'::uuid, 'repayment',     5000, current_date - 60, 'SACCO loan repayment'),
  ('11111111-1111-1111-1111-111111111101'::uuid, 'sale',         12000, current_date - 30, 'Maize sale at market'),
  ('11111111-1111-1111-1111-111111111101'::uuid, 'savings_deposit', 1500, current_date - 14, NULL),
  ('11111111-1111-1111-1111-111111111102'::uuid, 'sale',          9000, current_date - 7,  'Tomato harvest'),
  ('11111111-1111-1111-1111-111111111102'::uuid, 'training',         0, current_date - 21, 'GAP training'),
  ('11111111-1111-1111-1111-111111111104'::uuid, 'repayment',    15000, current_date - 45, 'Equipment loan'),
  ('11111111-1111-1111-1111-111111111104'::uuid, 'harvest',          0, current_date - 90, 'Coffee harvest'),
  ('11111111-1111-1111-1111-111111111105'::uuid, 'extension_visit',  0, current_date - 10, 'Extension officer visit'),
  ('11111111-1111-1111-1111-111111111106'::uuid, 'weather_damage', 8000, current_date - 120,'Drought losses')
) AS v(farmer_id, record_type, amount_kes, occurred_on, notes)
WHERE NOT EXISTS (
  SELECT 1 FROM public.farm_records r
  WHERE r.farmer_id = v.farmer_id AND r.record_type = v.record_type AND r.occurred_on = v.occurred_on
);

INSERT INTO public.loan_applications (farmer_id, amount_kes, term_months, purpose, status, source, trust_score_snapshot)
SELECT * FROM (VALUES
  ('11111111-1111-1111-1111-111111111101'::uuid, 30000,  6, 'seeds',     'submitted'::loan_status, 'web', 78),
  ('11111111-1111-1111-1111-111111111102'::uuid, 45000,  9, 'equipment', 'submitted'::loan_status, 'ussd', 71),
  ('11111111-1111-1111-1111-111111111104'::uuid, 80000, 12, 'livestock', 'submitted'::loan_status, 'web', 82)
) AS v(farmer_id, amount_kes, term_months, purpose, status, source, trust_score_snapshot)
WHERE NOT EXISTS (
  SELECT 1 FROM public.loan_applications l
  WHERE l.farmer_id = v.farmer_id AND l.amount_kes = v.amount_kes
);
