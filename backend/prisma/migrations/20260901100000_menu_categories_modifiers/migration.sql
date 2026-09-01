-- CreateEnum
CREATE TYPE "DrinkCategory" AS ENUM ('classics', 'special', 'ice');

-- AlterTable drinks
ALTER TABLE "drinks" ADD COLUMN "category" "DrinkCategory" NOT NULL DEFAULT 'classics';
ALTER TABLE "drinks" ADD COLUMN "badge" TEXT;
ALTER TABLE "drinks" ADD COLUMN "flavor_options" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE UNIQUE INDEX "drinks_name_category_key" ON "drinks"("name", "category");
CREATE INDEX "drinks_category_sort_order_idx" ON "drinks"("category", "sort_order");

-- AlterTable order_items
ALTER TABLE "order_items" ADD COLUMN "volume_ml" INTEGER;
UPDATE "order_items" SET "volume_ml" = CASE "size" WHEN 'S' THEN 250 WHEN 'M' THEN 350 WHEN 'L' THEN 450 END;
ALTER TABLE "order_items" ALTER COLUMN "volume_ml" SET NOT NULL;
ALTER TABLE "order_items" ADD COLUMN "flavor" TEXT;

-- CreateTable modifiers
CREATE TABLE "modifiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "modifiers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "modifiers_name_key" ON "modifiers"("name");

-- CreateTable order_item_modifiers
CREATE TABLE "order_item_modifiers" (
    "id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "modifier_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    CONSTRAINT "order_item_modifiers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "order_item_modifiers_order_item_id_modifier_id_key" ON "order_item_modifiers"("order_item_id", "modifier_id");

ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_modifier_id_fkey" FOREIGN KEY ("modifier_id") REFERENCES "modifiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
