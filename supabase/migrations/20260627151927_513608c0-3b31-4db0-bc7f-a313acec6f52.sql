
CREATE POLICY "Profiles: lenders read all" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_lender_staff(auth.uid()));
