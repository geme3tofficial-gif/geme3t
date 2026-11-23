CREATE TYPE "DigitalServiceQuoteStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "DigitalServiceFinanceType" AS ENUM ('REVENUE', 'EXPENSE');
CREATE TYPE "DigitalServicePaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'BOTH');

CREATE TABLE "digital_service_categories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "digital_service_categories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "digital_service_categories_name_key" UNIQUE ("name")
);

CREATE TABLE "digital_services" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "category_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "unit" TEXT NOT NULL DEFAULT 'unit',
  "price" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "digital_services_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "digital_services_category_name_key" UNIQUE ("category_id","name"),
  CONSTRAINT "digital_services_price_check" CHECK ("price" >= 0),
  CONSTRAINT "digital_services_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "digital_service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "digital_service_customers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" TEXT NOT NULL, "phone" TEXT NOT NULL,
  "coupon_code" TEXT, "service_count" INTEGER NOT NULL DEFAULT 0,
  "service_amount" DECIMAL(14,2) NOT NULL DEFAULT 0, "credit_balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "credit_score" INTEGER NOT NULL DEFAULT 0, "redeemed_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "referral_credit" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "digital_service_customers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "digital_service_customers_phone_key" UNIQUE ("phone"),
  CONSTRAINT "digital_service_customers_coupon_code_key" UNIQUE ("coupon_code"),
  CONSTRAINT "digital_service_customers_credit_check" CHECK ("credit_balance" >= 0)
);

CREATE TABLE "digital_service_affiliates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" TEXT NOT NULL, "phone" TEXT, "email" TEXT,
  "tier" TEXT NOT NULL DEFAULT 'Custom', "notes" TEXT, "active" BOOLEAN NOT NULL DEFAULT true,
  "discount_pct" DECIMAL(5,2) NOT NULL DEFAULT 0, "commission_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "commission_score" DECIMAL(14,2) NOT NULL DEFAULT 0, "customer_discount_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "digital_service_affiliates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "digital_service_affiliates_pct_check" CHECK ("discount_pct" BETWEEN 0 AND 100 AND "commission_pct" BETWEEN 0 AND 100)
);

CREATE TABLE "digital_service_coupons" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "code" TEXT NOT NULL, "tier" TEXT NOT NULL DEFAULT 'Custom',
  "customer_pct" DECIMAL(5,2) NOT NULL DEFAULT 0, "customer_direct" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "affiliate_pct" DECIMAL(5,2) NOT NULL DEFAULT 0, "affiliate_id" UUID,
  "referral_only" BOOLEAN NOT NULL DEFAULT false, "redemption_threshold" INTEGER NOT NULL DEFAULT 3,
  "usage_count" INTEGER NOT NULL DEFAULT 0, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "digital_service_coupons_pkey" PRIMARY KEY ("id"), CONSTRAINT "digital_service_coupons_code_key" UNIQUE ("code"),
  CONSTRAINT "digital_service_coupons_affiliate_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "digital_service_affiliates"("id") ON DELETE SET NULL,
  CONSTRAINT "digital_service_coupons_pct_check" CHECK ("customer_pct" BETWEEN 0 AND 100 AND "affiliate_pct" BETWEEN 0 AND 100),
  CONSTRAINT "digital_service_coupons_usage_check" CHECK ("usage_count" >= 0)
);

CREATE TABLE "digital_service_quotes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "customer_id" UUID, "coupon_id" UUID,
  "gross_total" DECIMAL(14,2) NOT NULL DEFAULT 0, "direct_discount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "coupon_discount" DECIMAL(14,2) NOT NULL DEFAULT 0, "payable_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "direct_cost" DECIMAL(14,2) NOT NULL DEFAULT 0, "net_profit" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "customer_discount" DECIMAL(14,2) NOT NULL DEFAULT 0, "commission_earned" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "status" "DigitalServiceQuoteStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "digital_service_quotes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "digital_service_quotes_customer_fkey" FOREIGN KEY ("customer_id") REFERENCES "digital_service_customers"("id") ON DELETE SET NULL,
  CONSTRAINT "digital_service_quotes_coupon_fkey" FOREIGN KEY ("coupon_id") REFERENCES "digital_service_coupons"("id") ON DELETE SET NULL,
  CONSTRAINT "digital_service_quotes_amounts_check" CHECK ("gross_total" >= 0 AND "direct_discount" >= 0 AND "payable_total" >= 0 AND "net_profit" >= 0)
);

CREATE TABLE "digital_service_quote_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "quote_id" UUID NOT NULL, "service_id" UUID,
  "name" TEXT NOT NULL, "unit" TEXT NOT NULL, "unit_price" DECIMAL(14,2) NOT NULL,
  "quantity" INTEGER NOT NULL, "line_total" DECIMAL(14,2) NOT NULL, "status" TEXT NOT NULL DEFAULT 'pending',
  "completed_at" TIMESTAMPTZ(6), "carryover_date" DATE, "payment_channels" TEXT[] NOT NULL DEFAULT '{}',
  "cash_amount" DECIMAL(14,2) NOT NULL DEFAULT 0, "transfer_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "redemption_amount" DECIMAL(14,2) NOT NULL DEFAULT 0, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "digital_service_quote_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "digital_service_quote_items_quote_fkey" FOREIGN KEY ("quote_id") REFERENCES "digital_service_quotes"("id") ON DELETE CASCADE,
  CONSTRAINT "digital_service_quote_items_service_fkey" FOREIGN KEY ("service_id") REFERENCES "digital_services"("id") ON DELETE SET NULL,
  CONSTRAINT "digital_service_quote_items_quantity_check" CHECK ("quantity" >= 0),
  CONSTRAINT "digital_service_quote_items_status_check" CHECK ("status" IN ('pending','completed'))
);

CREATE TABLE "digital_service_day_closes" (
  "date" DATE NOT NULL, "pending_count" INTEGER NOT NULL DEFAULT 0,
  "closed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "digital_service_day_closes_pkey" PRIMARY KEY ("date")
);

CREATE TABLE "digital_service_finance_entries" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "entry_date" DATE NOT NULL,
  "type" "DigitalServiceFinanceType" NOT NULL, "category" TEXT NOT NULL, "description" TEXT,
  "amount" DECIMAL(14,2) NOT NULL, "payment_method" "DigitalServicePaymentMethod" NOT NULL DEFAULT 'CASH',
  "source" TEXT NOT NULL DEFAULT 'manual', "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "digital_service_finance_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "digital_service_finance_entries_amount_check" CHECK ("amount" >= 0)
);

CREATE TABLE "digital_service_app_settings" (
  "key" TEXT NOT NULL, "value" TEXT NOT NULL,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "digital_service_app_settings_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "digital_services_category_id_idx" ON "digital_services"("category_id");
CREATE INDEX "digital_service_quotes_status_created_idx" ON "digital_service_quotes"("status","created_at");
CREATE INDEX "digital_service_quote_items_quote_status_idx" ON "digital_service_quote_items"("quote_id","status");
CREATE INDEX "digital_service_finance_entries_date_type_idx" ON "digital_service_finance_entries"("entry_date","type");

INSERT INTO "digital_service_app_settings" ("key","value") VALUES ('customer_credit_pct','5') ON CONFLICT ("key") DO NOTHING;

INSERT INTO "digital_service_categories" ("name")
SELECT name FROM (VALUES
  ('Print & Bind'), ('Typing & Document Services'), ('Online Registrations & Portal'), ('Graphic Design & Branding')
) AS seed(name)
WHERE NOT EXISTS (SELECT 1 FROM "digital_service_categories");

INSERT INTO "digital_services" ("category_id","name","unit","price")
SELECT c.id, s.name, s.unit, s.price
FROM "digital_service_categories" c
JOIN (VALUES
  ('Print & Bind','B&W Print','page',100), ('Print & Bind','Colour Page','page',200),
  ('Print & Bind','Photocopy','page',50), ('Print & Bind','Hard Binding','copy',3000),
  ('Print & Bind','Spiral Binding','copy',700), ('Print & Bind','Lamination (A4)','sheet',300),
  ('Print & Bind','ID Card Lamination','card',200),
  ('Typing & Document Services','Typesetting / Typing','page',300),
  ('Typing & Document Services','Document Scanning','page',150),
  ('Typing & Document Services','CV / Resume Formatting','doc',2000),
  ('Typing & Document Services','PDF Conversion / Merge','file',500),
  ('Online Registrations & Portal','JAMB / Post-UTME Reg','form',1500),
  ('Online Registrations & Portal','NIN / BVN Slip Reprint','slip',1000),
  ('Online Registrations & Portal','Remita / School Portal Pay','txn',1000),
  ('Online Registrations & Portal','CAC Business Name Filing','filing',15000),
  ('Graphic Design & Branding','Flyer / E-Poster Design','design',5000),
  ('Graphic Design & Branding','Logo Design','design',15000),
  ('Graphic Design & Branding','Passport Photo (4 copies)','set',1000)
) AS s(category,name,unit,price) ON s.category=c.name
WHERE NOT EXISTS (SELECT 1 FROM "digital_services");

CREATE OR REPLACE FUNCTION public.is_digital_service_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;

ALTER TABLE "digital_service_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "digital_services" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "digital_service_customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "digital_service_affiliates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "digital_service_coupons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "digital_service_quotes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "digital_service_quote_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "digital_service_day_closes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "digital_service_finance_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "digital_service_app_settings" ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'digital_service_categories','digital_services','digital_service_customers',
    'digital_service_affiliates','digital_service_coupons','digital_service_quotes',
    'digital_service_quote_items','digital_service_day_closes',
    'digital_service_finance_entries','digital_service_app_settings'
  ] LOOP
    EXECUTE format('CREATE POLICY "digital service admin select %I" ON public.%I FOR SELECT TO authenticated USING (public.is_digital_service_admin())', table_name, table_name);
    EXECUTE format('CREATE POLICY "digital service admin insert %I" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_digital_service_admin())', table_name, table_name);
    EXECUTE format('CREATE POLICY "digital service admin update %I" ON public.%I FOR UPDATE TO authenticated USING (public.is_digital_service_admin()) WITH CHECK (public.is_digital_service_admin())', table_name, table_name);
    EXECUTE format('CREATE POLICY "digital service admin delete %I" ON public.%I FOR DELETE TO authenticated USING (public.is_digital_service_admin())', table_name, table_name);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.complete_digital_service_quote_item(
  p_quote_item_id UUID,
  p_cash_amount DECIMAL,
  p_transfer_amount DECIMAL,
  p_redemption_amount DECIMAL DEFAULT 0
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_item public.digital_service_quote_items%ROWTYPE;
  v_quote public.digital_service_quotes%ROWTYPE;
  v_total DECIMAL;
  v_net DECIMAL;
BEGIN
  IF NOT public.is_digital_service_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  SELECT * INTO v_item FROM public.digital_service_quote_items WHERE id = p_quote_item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quote item not found'; END IF;
  IF v_item.status = 'completed' THEN RETURN v_item.id; END IF;
  IF p_cash_amount < 0 OR p_transfer_amount < 0 OR p_redemption_amount < 0 THEN
    RAISE EXCEPTION 'Payment amounts cannot be negative';
  END IF;
  v_total := p_cash_amount + p_transfer_amount + p_redemption_amount;
  IF v_total <> v_item.line_total THEN RAISE EXCEPTION 'Payment does not cover the quote item'; END IF;
  SELECT * INTO v_quote FROM public.digital_service_quotes WHERE id = v_item.quote_id FOR UPDATE;
  v_net := GREATEST(0, v_quote.net_profit);

  UPDATE public.digital_service_quote_items
  SET status='completed', completed_at=CURRENT_TIMESTAMP,
      payment_channels=CASE
        WHEN p_cash_amount > 0 AND p_transfer_amount > 0 THEN ARRAY['cash','transfer']
        WHEN p_cash_amount > 0 THEN ARRAY['cash']
        WHEN p_transfer_amount > 0 THEN ARRAY['transfer']
        ELSE ARRAY['redemption']
      END,
      cash_amount=p_cash_amount, transfer_amount=p_transfer_amount, redemption_amount=p_redemption_amount
  WHERE id=p_quote_item_id;

  IF v_quote.customer_id IS NOT NULL THEN
    UPDATE public.digital_service_customers
    SET service_count=service_count + v_item.quantity,
        service_amount=service_amount + v_item.line_total,
        credit_balance=credit_balance + GREATEST(0, v_net *
          CASE WHEN v_quote.gross_total > 0 THEN v_item.line_total / v_quote.gross_total ELSE 0 END *
          COALESCE((SELECT value::DECIMAL / 100 FROM public.digital_service_app_settings WHERE key='customer_credit_pct'),0)),
        redeemed_amount=redeemed_amount + p_redemption_amount
    WHERE id=v_quote.customer_id;
  END IF;

  IF v_quote.coupon_id IS NOT NULL THEN
    UPDATE public.digital_service_coupons SET usage_count=usage_count+1 WHERE id=v_quote.coupon_id;
  END IF;

  INSERT INTO public.digital_service_finance_entries (
    entry_date,type,category,description,amount,payment_method,source
  ) VALUES (
    CURRENT_DATE,'REVENUE','Completed digital service',
    'Quote item ' || v_item.id::TEXT,
    v_item.line_total,
    CASE WHEN p_cash_amount>0 AND p_transfer_amount>0 THEN 'BOTH'
         WHEN p_transfer_amount>0 THEN 'TRANSFER' ELSE 'CASH' END,
    'system'
  );
  RETURN v_item.id;
END;
$$;
