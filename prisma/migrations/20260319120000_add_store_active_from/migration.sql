ALTER TABLE "stores"
ADD COLUMN "activeFrom" DATE;

UPDATE "stores"
SET "activeFrom" = COALESCE(DATE("createdAt"), CURRENT_DATE)
WHERE "activeFrom" IS NULL;

ALTER TABLE "stores"
ALTER COLUMN "activeFrom" SET NOT NULL;
