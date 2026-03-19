WITH ranked_memberships AS (
  SELECT
    id,
    "companyId",
    "userId",
    ROW_NUMBER() OVER (
      PARTITION BY "userId"
      ORDER BY
        CASE WHEN role = 'OWNER' THEN 0 ELSE 1 END,
        "createdAt" ASC,
        id ASC
    ) AS membership_rank
  FROM "company_members"
),
deleted_memberships AS (
  DELETE FROM "company_members"
  WHERE id IN (
    SELECT id
    FROM ranked_memberships
    WHERE membership_rank > 1
  )
  RETURNING "companyId"
)
DELETE FROM "companies"
WHERE id IN (
  SELECT DISTINCT dm."companyId"
  FROM deleted_memberships dm
)
AND NOT EXISTS (
  SELECT 1
  FROM "company_members" cm
  WHERE cm."companyId" = "companies".id
);

CREATE UNIQUE INDEX "company_members_userId_key" ON "company_members"("userId");
