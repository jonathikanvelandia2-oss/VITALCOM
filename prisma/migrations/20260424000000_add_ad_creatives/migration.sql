-- CreateEnum
CREATE TYPE "CreativeAngle" AS ENUM ('BENEFIT', 'PAIN_POINT', 'SOCIAL_PROOF', 'URGENCY', 'LIFESTYLE', 'TESTIMONIAL', 'BEFORE_AFTER', 'PROBLEM_SOLUTION');

-- CreateEnum
CREATE TYPE "CreativeStatus" AS ENUM ('GENERATING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "CreativeRatio" AS ENUM ('SQUARE', 'PORTRAIT', 'STORY', 'LANDSCAPE');

-- CreateTable
CREATE TABLE "AdCreative" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "angle" "CreativeAngle" NOT NULL,
    "platform" "AdPlatform" NOT NULL DEFAULT 'META',
    "ratio" "CreativeRatio" NOT NULL DEFAULT 'SQUARE',
    "status" "CreativeStatus" NOT NULL DEFAULT 'READY',
    "headline" TEXT NOT NULL,
    "primaryText" TEXT NOT NULL,
    "description" TEXT,
    "cta" TEXT DEFAULT 'BUY_NOW',
    "hashtags" TEXT[],
    "imageUrl" TEXT,
    "imagePrompt" TEXT,
    "score" INTEGER NOT NULL DEFAULT 70,
    "reasoning" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdCreative_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdCreative_userId_productId_idx" ON "AdCreative"("userId", "productId");

-- CreateIndex
CREATE INDEX "AdCreative_userId_status_idx" ON "AdCreative"("userId", "status");

-- AddForeignKey
ALTER TABLE "AdCreative" ADD CONSTRAINT "AdCreative_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCreative" ADD CONSTRAINT "AdCreative_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
