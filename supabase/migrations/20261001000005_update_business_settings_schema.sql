-- ============================================================================
-- Migration: Update business_settings schema
-- Phase 10D Prerequisite: Business Settings Schema Correction
-- Reference: docs/database-architecture.md
-- ============================================================================
-- Modifications:
--   1. Adds reach_us_number TEXT
--   2. Adds gpay_upi_numbers TEXT[] NOT NULL DEFAULT '{}'
--   3. Migrates any existing gpay_upi_number values into gpay_upi_numbers
--   4. Safely drops obsolete gpay_upi_number column
--   5. Preserves existing constraints, singleton structure (id = 1), and RLS
-- ============================================================================

-- 1. Add reach_us_number column
ALTER TABLE business_settings
ADD COLUMN IF NOT EXISTS reach_us_number TEXT;

-- 2. Add gpay_upi_numbers column as TEXT[] array
ALTER TABLE business_settings
ADD COLUMN IF NOT EXISTS gpay_upi_numbers TEXT[] NOT NULL DEFAULT '{}';

-- 3. Data Migration and Safe Column Removal
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'business_settings' 
          AND column_name = 'gpay_upi_number'
    ) THEN
        -- Migrate any existing scalar UPI number into the new array column
        UPDATE business_settings 
        SET gpay_upi_numbers = ARRAY[gpay_upi_number]
        WHERE gpay_upi_number IS NOT NULL 
          AND (gpay_upi_numbers IS NULL OR gpay_upi_numbers = '{}');

        -- Safely drop the obsolete scalar column
        ALTER TABLE business_settings DROP COLUMN gpay_upi_number;
    END IF;
END $$;
