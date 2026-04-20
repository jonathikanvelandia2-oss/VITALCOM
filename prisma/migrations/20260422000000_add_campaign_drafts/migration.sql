-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('DRAFT', 'READY', 'LAUNCHED', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CampaignObjective" AS ENUM ('CONVERSIONS', 'TRAFFIC', 'REACH', 'LEADS', 'ENGAGEMENT', 'MESSAGES');

-- CreateTable
CREATE TABLE "CampaignDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "platform" "AdPlatform" NOT NULL DEFAULT 'META',
    "objective" "CampaignObjective" NOT NULL DEFAULT 'CONVERSIONS',
    "status" "DraftStatus" NOT NULL DEFAULT 'DRAFT',
    "step" INTEGER NOT NULL DEFAULT 1,
    "targetCountry" "Country",
    "ageMin" INTEGER DEFAULT 18,
    "ageMax" INTEGER DEFAULT 55,
    "gender" TEXT DEFAULT 'ALL',
    "interests" TEXT[],
    "placements" TEXT[],
    "headline" TEXT,
    "primaryText" TEXT,
    "description" TEXT,
    "cta" TEXT DEFAULT 'BUY_NOW',
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "landingUrl" TEXT,
    "dailyBudget" DOUBLE PRECISION,
    "totalBudget" DOUBLE PRECISION,
    "durationDays" INTEGER DEFAULT 7,
    "startDate" TIMESTAMP(3),
    "launchedCampaignId" TEXT,
    "externalId" TEXT,
    "launchNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampaignDraft_userId_status_idx" ON "CampaignDraft"("userId", "status");

-- AddForeignKey
ALTER TABLE "CampaignDraft" ADD CONSTRAINT "CampaignDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignDraft" ADD CONSTRAINT "CampaignDraft_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
