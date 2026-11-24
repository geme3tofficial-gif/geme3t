ALTER TABLE "digital_service_customers"
ADD COLUMN "share_token_hash" TEXT;

CREATE UNIQUE INDEX "digital_service_customers_share_token_hash_key"
ON "digital_service_customers"("share_token_hash");
