
REVOKE ALL ON FUNCTION public.on_purchase_active() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
COMMENT ON TABLE public.ussd_sessions IS 'Service-role only: USSD route uses admin client. RLS enabled with no user policies by design.';
