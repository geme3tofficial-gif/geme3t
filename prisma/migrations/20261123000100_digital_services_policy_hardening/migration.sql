DROP POLICY IF EXISTS "digital service admin delete digital_service_finance_entries" ON public.digital_service_finance_entries;
CREATE POLICY "digital service manual finance delete"
ON public.digital_service_finance_entries
FOR DELETE TO authenticated
USING (public.is_digital_service_admin() AND source = 'manual');

DROP POLICY IF EXISTS "digital service admin insert digital_service_finance_entries" ON public.digital_service_finance_entries;
CREATE POLICY "digital service finance insert"
ON public.digital_service_finance_entries
FOR INSERT TO authenticated
WITH CHECK (public.is_digital_service_admin() AND source = 'manual');

DROP POLICY IF EXISTS "digital service admin update digital_service_finance_entries" ON public.digital_service_finance_entries;
CREATE POLICY "digital service finance update"
ON public.digital_service_finance_entries
FOR UPDATE TO authenticated
USING (public.is_digital_service_admin() AND source = 'manual')
WITH CHECK (public.is_digital_service_admin() AND source = 'manual');
