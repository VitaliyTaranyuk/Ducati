-- Per-flavor size prices (classic cappuccino vs cappuccino cream).
ALTER TABLE "drinks" ADD COLUMN "flavor_prices" JSONB NOT NULL DEFAULT '{}'::jsonb;
