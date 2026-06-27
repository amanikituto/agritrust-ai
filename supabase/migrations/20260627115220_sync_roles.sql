-- Sync user_roles when profiles.account_type changes
CREATE OR REPLACE FUNCTION public.sync_user_role_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_type = 'lender' THEN
    -- If they don't have any lender roles, give them loan_officer
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = NEW.id 
      AND role IN ('loan_officer', 'credit_manager', 'institution_admin', 'system_admin')
    ) THEN
      -- Remove farmer role if it exists
      DELETE FROM public.user_roles WHERE user_id = NEW.id AND role = 'farmer';
      
      INSERT INTO public.user_roles (user_id, role) 
      VALUES (NEW.id, 'loan_officer')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  ELSIF NEW.account_type = 'farmer' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = NEW.id AND role = 'farmer'
    ) THEN
       -- Remove lender roles
       DELETE FROM public.user_roles 
       WHERE user_id = NEW.id 
       AND role IN ('loan_officer', 'credit_manager', 'institution_admin', 'system_admin');
       
       INSERT INTO public.user_roles (user_id, role) 
       VALUES (NEW.id, 'farmer')
       ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_role ON public.profiles;
CREATE TRIGGER trg_sync_profile_role
AFTER INSERT OR UPDATE OF account_type ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_from_profile();
