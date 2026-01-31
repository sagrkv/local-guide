-- Migration: Rename SALES_REP role to USER
-- This migration renames the SALES_REP enum value to USER in the UserRole enum

-- Step 1: Add USER value to the enum (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'USER'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
    ) THEN
        ALTER TYPE "UserRole" ADD VALUE 'USER';
    END IF;
END$$;

-- Step 2: Update all users with SALES_REP role to USER
UPDATE users SET role = 'USER' WHERE role = 'SALES_REP';

-- Note: In PostgreSQL, you cannot remove enum values directly.
-- The old 'SALES_REP' value will remain in the enum but won't be used.
-- This is a known PostgreSQL limitation. For a complete cleanup,
-- you would need to create a new enum and migrate the column,
-- but that's a more complex operation.

-- For reference, if you ever need to fully remove SALES_REP:
-- 1. Create new enum type without SALES_REP
-- 2. Update column to use new enum
-- 3. Drop old enum
-- 4. Rename new enum to old name
