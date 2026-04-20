-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('PAUSE_CAMPAIGN', 'SCALE_BUDGET', 'REDUCE_BUDGET', 'TEST_CREATIVE', 'TEST_AUDIENCE', 'OPTIMIZE_BID', 'RESTART_CAMPAIGN', 'ADD_TRACKING');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('PENDING', 'APPLIED', 'DISMISSED', 'EXPIRED');

-- CreateTable
CREATE TABLE "CampaignRecommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT,
    "accountId" TEXT,
    "type" "RecommendationType" NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 50,
    "title" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "actionLabel" TEXT NOT NULL,
    "suggestedValue" DOUBLE PRECISION,
    "roas" DOUBLE PRECISION,
    "spend" DOUBLE PRECISION,
    "revenue" DOUBLE PRECISION,
    "clicks" INTEGER,
    "conversions" INTEGER,
    "impressions" INTEGER,
    "confidence" DOUBLE PRECISION DEFAULT 0.5,
    "appliedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampaignRecommendation_userId_status_idx" ON "CampaignRecommendation"("userId", "status");

-- CreateIndex
CREATE INDEX "CampaignRecommendation_campaignId_idx" ON "CampaignRecommendation"("campaignId");

-- AddForeignKey
ALTER TABLE "CampaignRecommendation" ADD CONSTRAINT "CampaignRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecommendation" ADD CONSTRAINT "CampaignRecommendation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecommendation" ADD CONSTRAINT "CampaignRecommendation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "AdAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
