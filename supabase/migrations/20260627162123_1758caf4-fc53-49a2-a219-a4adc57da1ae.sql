CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_type TEXT := COALESCE(NEW.raw_user_meta_data->>'account_type', 'farmer');
  v_full_name    TEXT := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email);
  v_phone        TEXT := NEW.phone;
BEGIN
  IF v_account_type NOT IN ('farmer', 'lender') THEN
    v_account_type := 'farmer';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, phone, account_type)
  VALUES (NEW.id, v_full_name, NEW.email, v_phone, v_account_type)
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        email = COALESCE(EXCLUDED.email, public.profiles.email),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        account_type = EXCLUDED.account_type;

  IF v_account_type = 'lender' THEN
    DELETE FROM public.user_roles WHERE user_id = NEW.id AND role = 'farmer';
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'loan_officer')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles
    WHERE user_id = NEW.id
      AND role IN ('loan_officer','credit_manager','institution_admin','system_admin');
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'farmer')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_user_role_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_type = 'lender' THEN
    DELETE FROM public.user_roles WHERE user_id = NEW.id AND role = 'farmer';
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'loan_officer')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF NEW.account_type = 'farmer' THEN
    DELETE FROM public.user_roles
    WHERE user_id = NEW.id
      AND role IN ('loan_officer', 'credit_manager', 'institution_admin', 'system_admin');
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'farmer')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS trg_sync_profile_role ON public.profiles;
CREATE TRIGGER trg_sync_profile_role
AFTER INSERT OR UPDATE OF account_type ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_from_profile();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_user_role_from_profile() FROM PUBLIC, anon, authenticated;