-- Campos nuevos en WorkflowTemplate
ALTER TABLE "WorkflowTemplate"
  ADD COLUMN IF NOT EXISTS "slug"   TEXT,
  ADD COLUMN IF NOT EXISTS "emoji"  TEXT,
  ADD COLUMN IF NOT EXISTS "target" TEXT,
  ADD COLUMN IF NOT EXISTS "impact" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "WorkflowTemplate_slug_key" ON "WorkflowTemplate"("slug");

-- Enum de estado
DO $$ BEGIN
  CREATE TYPE "WorkflowStatus" AS ENUM ('ACTIVE', 'PAUSED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabla de activaciones por usuario
CREATE TABLE IF NOT EXISTS "UserWorkflowActivation" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "templateId"   TEXT NOT NULL,
  "status"       "WorkflowStatus" NOT NULL DEFAULT 'ACTIVE',
  "executions"   INTEGER NOT NULL DEFAULT 0,
  "successCount" INTEGER NOT NULL DEFAULT 0,
  "lastRunAt"    TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserWorkflowActivation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserWorkflowActivation_userId_templateId_key"
  ON "UserWorkflowActivation"("userId", "templateId");
CREATE INDEX IF NOT EXISTS "UserWorkflowActivation_userId_idx"
  ON "UserWorkflowActivation"("userId");

ALTER TABLE "UserWorkflowActivation" ADD CONSTRAINT "UserWorkflowActivation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserWorkflowActivation" ADD CONSTRAINT "UserWorkflowActivation_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
