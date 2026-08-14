-- =====================================================
-- PoultryOps
-- Migration 006
-- Enforce one farm per owner (data integrity hardening)
-- =====================================================
--
-- BUSINESS RULE:
--   ONE AUTH ACCOUNT / EMAIL = ONE FARM OWNER = ONE FARM
--
-- A production incident created two farms with the same owner_id
-- within ~5.7 seconds because no unique constraint existed on
-- farms(owner_id).
--
-- The duplicate was already removed. Verified on 2026-08-14 that
-- only 5 farms remain with 5 distinct owner_id values (0 duplicates)
-- via: SELECT owner_id, COUNT(*) FROM farms GROUP BY owner_id HAVING COUNT(*) > 1;
--
-- This unique constraint is the FINAL protection against the
-- race condition where two simultaneous onboarding requests try
-- to create a farm for the same authenticated user.
-- createFarmAndTrial() also performs an application-level pre-check
-- for a friendly error message, but the database guarantees correctness.

-- Add the unique constraint (auto-creates a unique btree index;
-- do NOT also create a separate plain index on owner_id).
ALTER TABLE public.farms
ADD CONSTRAINT farms_owner_id_key UNIQUE (owner_id);

-- Verify: SELECT conname FROM pg_constraint WHERE conrelid = 'farms'::regclass AND conname = 'farms_owner_id_key';
-- Rollback: ALTER TABLE public.farms DROP CONSTRAINT farms_owner_id_key;