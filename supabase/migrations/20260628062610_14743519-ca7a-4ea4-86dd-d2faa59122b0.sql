-- Remove farmer self-write on trust_scores; only service role writes
DROP POLICY IF EXISTS "Trust scores: farmer inserts own" ON public.trust_scores;
DROP POLICY IF EXISTS "Trust scores: farmer updates own" ON public.trust_scores;

-- Remove client-side audit insert; only service role writes
DROP POLICY IF EXISTS "actor inserts own event" ON public.audit_events;

-- Document fail-closed denial on ussd_sessions and wallets writes
COMMENT ON TABLE public.ussd_sessions IS 'RLS enabled, fail-closed: no SELECT/INSERT/UPDATE/DELETE policies for any role. All access via service role from the USSD edge handler only.';
COMMENT ON TABLE public.wallets IS 'RLS enabled. Owner SELECT only. All balance mutations performed by service role via SECURITY DEFINER triggers (on_purchase_active) — no direct client write path.';

-- Lock down SECURITY DEFINER functions: revoke PUBLIC/anon/authenticated EXECUTE
-- on functions that should never be called directly via PostgREST RPC.
-- Trigger functions: not invoked via RPC, safe to revoke from all roles.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_user_role_from_profile() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_farmer_profile() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_purchase_active() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- has_role and is_lender_staff are used inside RLS policies. RLS policy
-- evaluation requires the querying role to have EXECUTE. Keep authenticated,
-- but revoke from anon and PUBLIC.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_lender_staff(uuid) FROM PUBLIC, anon;