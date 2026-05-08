CREATE TYPE "StoreRole" AS ENUM ('OWNER', 'MANAGER', 'EMPLOYEE');

ALTER TABLE "store_employees"
ADD COLUMN "role" "StoreRole" NOT NULL DEFAULT 'EMPLOYEE',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "store_employees" se
SET "role" = CASE cm."role"
  WHEN 'OWNER' THEN 'OWNER'::"StoreRole"
  WHEN 'MANAGER' THEN 'MANAGER'::"StoreRole"
  ELSE 'EMPLOYEE'::"StoreRole"
END
FROM "stores" s
JOIN "company_members" cm
  ON cm."companyId" = s."companyId"
WHERE se."storeId" = s."id"
  AND se."userId" = cm."userId";

UPDATE "store_employees" se
SET "role" = 'OWNER'::"StoreRole"
FROM "stores" s
JOIN "companies" c
  ON c."id" = s."companyId"
WHERE se."storeId" = s."id"
  AND se."userId" = c."ownerId";

INSERT INTO "store_employees" ("id", "storeId", "userId", "role", "createdAt", "updatedAt")
SELECT
  'owner-' || s."id" || '-' || c."ownerId",
  s."id",
  c."ownerId",
  'OWNER'::"StoreRole",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "stores" s
JOIN "companies" c
  ON c."id" = s."companyId"
LEFT JOIN "store_employees" se
  ON se."storeId" = s."id"
 AND se."userId" = c."ownerId"
WHERE se."id" IS NULL;

ALTER TABLE "stores" DROP CONSTRAINT "stores_companyId_fkey";
ALTER TABLE "company_members" DROP CONSTRAINT "company_members_companyId_fkey";
ALTER TABLE "company_members" DROP CONSTRAINT "company_members_userId_fkey";

ALTER TABLE "stores" DROP COLUMN "companyId";

DROP TABLE "company_members";
DROP TABLE "companies";

DROP TYPE "CompanyRole";
