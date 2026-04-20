-- Enum de plataformas publicitarias
DO $$ BEGIN
  CREATE TYPE "AdPlatform" AS ENUM ('META', 'TIKTOK', 'GOOGLE', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AdAccount: cuentas publicitarias conectadas (OAuth o manual)
CREATE TABLE IF NOT EXISTS "AdAccount" (
  "id"             TEXT NOT NULL,
  "userId"         TEXT NOT NULL,
  "platform"       "AdPlatform" NOT NULL,
  "accountId"      TEXT NOT NULL,
  "accountName"    TEXT,
  "currency"       TEXT NOT NULL DEFAULT 'COP',
  "connected"      BOOLEAN NOT NULL DEFAULT false,
  "accessToken"    TEXT,
  "refreshToken"   TEXT,
  "tokenExpiresAt" TIMESTAMP(3),
  "lastSyncAt"     TIMESTAMP(3),
  "active"         BOOLEAN NOT NULL DEFAULT true,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdAccount_userId_platform_accountId_key"
  ON "AdAccount"("userId", "platform", "accountId");
CREATE INDEX IF NOT EXISTS "AdAccount_userId_idx" ON "AdAccount"("userId");

ALTER TABLE "AdAccount" ADD CONSTRAINT "AdAccount_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AdCampaign: campañas dentro de una cuenta
CREATE TABLE IF NOT EXISTS "AdCampaign" (
  "id"         TEXT NOT NULL,
  "accountId"  TEXT NOT NULL,
  "externalId" TEXT,
  "name"       TEXT NOT NULL,
  "objective"  TEXT,
  "status"     TEXT NOT NULL DEFAULT 'ACTIVE',
  "startDate"  TIMESTAMP(3),
  "endDate"    TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdCampaign_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdCampaign_accountId_idx" ON "AdCampaign"("accountId");

ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "AdAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AdSpendEntry: registro de gasto por día (manual o API)
CREATE TABLE IF NOT EXISTS "AdSpendEntry" (
  "id"             TEXT NOT NULL,
  "accountId"      TEXT NOT NULL,
  "campaignId"     TEXT,
  "date"           DATE NOT NULL,
  "spend"          DOUBLE PRECISION NOT NULL,
  "impressions"    INTEGER,
  "clicks"         INTEGER,
  "conversions"    INTEGER,
  "source"         TEXT NOT NULL DEFAULT 'MANUAL',
  "financeEntryId" TEXT,
  "notes"          TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdSpendEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdSpendEntry_financeEntryId_key"
  ON "AdSpendEntry"("financeEntryId");
CREATE INDEX IF NOT EXISTS "AdSpendEntry_accountId_date_idx"
  ON "AdSpendEntry"("accountId", "date");
CREATE INDEX IF NOT EXISTS "AdSpendEntry_campaignId_date_idx"
  ON "AdSpendEntry"("campaignId", "date");

ALTER TABLE "AdSpendEntry" ADD CONSTRAINT "AdSpendEntry_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "AdAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdSpendEntry" ADD CONSTRAINT "AdSpendEntry_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
