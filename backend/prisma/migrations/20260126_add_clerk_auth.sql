-- Migration: Add Clerk Authentication Support
-- This migration adds fields needed for Clerk authentication integration

-- Add clerkId column for Clerk user identification
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "clerkId" TEXT UNIQUE;

-- Add imageUrl column for profile images from Clerk
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- Make password optional for Clerk-only users
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- Create index on clerkId for faster lookups
CREATE INDEX IF NOT EXISTS "users_clerkId_idx" ON "users" ("clerkId");

-- Note: After running this migration:
-- 1. Set up Clerk webhooks to sync users
-- 2. Existing users will need to sign up with Clerk using the same email
-- 3. The webhook will link their Clerk account to their existing user record
