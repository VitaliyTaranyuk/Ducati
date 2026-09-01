-- AlterTable drinks
ALTER TABLE "drinks" ADD COLUMN "excluded_modifier_names" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
