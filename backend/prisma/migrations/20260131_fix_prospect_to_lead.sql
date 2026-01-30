-- Migration: Fix Scraped Leads Not Appearing
-- Problem: Scraped businesses were saved as PROSPECT but Leads page shows only LEAD
-- Solution: Update existing PROSPECT records to LEAD

-- Update all existing PROSPECT records to LEAD
UPDATE leads SET "prospectStatus" = 'LEAD' WHERE "prospectStatus" = 'PROSPECT';
