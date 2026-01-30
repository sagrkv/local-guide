-- Migration: Simplify Lead Pipeline Stages
-- Old stages: NEW, CONTACTED, QUALIFIED, PROPOSAL, NEGOTIATION, WON, LOST
-- New stages: NEW, CONTACTED, INTERESTED, CLOSED
--
-- Mapping:
--   NEW -> NEW (no change)
--   CONTACTED -> CONTACTED (no change)
--   QUALIFIED -> INTERESTED
--   PROPOSAL -> INTERESTED
--   NEGOTIATION -> INTERESTED
--   WON -> CLOSED
--   LOST -> CLOSED

-- Step 1: Update existing leads to use new stage values
-- Map QUALIFIED, PROPOSAL, NEGOTIATION to INTERESTED
UPDATE leads SET stage = 'INTERESTED' WHERE stage IN ('QUALIFIED', 'PROPOSAL', 'NEGOTIATION');

-- Map WON, LOST to CLOSED
UPDATE leads SET stage = 'CLOSED' WHERE stage IN ('WON', 'LOST');

-- Step 2: Update the enum type in PostgreSQL
-- First create a new enum type
CREATE TYPE "LeadStage_new" AS ENUM ('NEW', 'CONTACTED', 'INTERESTED', 'CLOSED');

-- Alter the column to use the new enum (requires casting)
ALTER TABLE leads
  ALTER COLUMN stage TYPE "LeadStage_new"
  USING (stage::text::"LeadStage_new");

-- Drop the old enum and rename the new one
DROP TYPE "LeadStage";
ALTER TYPE "LeadStage_new" RENAME TO "LeadStage";

-- Note: After running this migration, run `npx prisma generate` to update the Prisma client
