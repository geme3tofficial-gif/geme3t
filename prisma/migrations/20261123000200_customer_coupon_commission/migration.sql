UPDATE public.digital_service_coupons
SET affiliate_pct = 5
WHERE referral_only = true
  AND lower(tier) = 'customer'
  AND affiliate_pct = 0;
