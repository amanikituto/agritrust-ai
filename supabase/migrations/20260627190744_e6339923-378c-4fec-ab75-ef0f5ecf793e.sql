
-- Ensure every farmer has a farmer_profiles row so lender directory shows them after registration.
CREATE OR REPLACE FUNCTION public.ensure_farmer_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_type = 'farmer' THEN
    INSERT INTO public.farmer_profiles (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_farmer_profile_on_profile ON public.profiles;
CREATE TRIGGER ensure_farmer_profile_on_profile
AFTER INSERT OR UPDATE OF account_type ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.ensure_farmer_profile();

-- Backfill any existing farmer profile rows missing from farmer_profiles
INSERT INTO public.farmer_profiles (id)
SELECT p.id FROM public.profiles p
LEFT JOIN public.farmer_profiles fp ON fp.id = p.id
WHERE p.account_type = 'farmer' AND fp.id IS NULL;

-- Masumi agent jobs ledger (records each lender->agritrust payment + receipt)
CREATE TABLE IF NOT EXISTS public.agent_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('basic','standard','premium')),
  amount_kes INTEGER NOT NULL,
  masumi_job_id TEXT NOT NULL,
  escrow_tx TEXT NOT NULL,
  explorer_url TEXT,
  outbound_tx TEXT,
  outbound_explorer_url TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  is_mocked BOOLEAN NOT NULL DEFAULT TRUE,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.agent_jobs TO authenticated;
GRANT ALL ON public.agent_jobs TO service_role;
ALTER TABLE public.agent_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agent jobs: buyer reads own" ON public.agent_jobs
  FOR SELECT TO authenticated USING (auth.uid() = buyer_id);
CREATE POLICY "Agent jobs: lender staff read all" ON public.agent_jobs
  FOR SELECT TO authenticated USING (public.is_lender_staff(auth.uid()));
CREATE POLICY "Agent jobs: buyer creates own" ON public.agent_jobs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
