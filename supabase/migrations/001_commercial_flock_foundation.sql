-- =====================================================
-- PoultryOps
-- Migration 001
-- Commercial Flock Foundation
-- =====================================================

ALTER TABLE flocks

-- Identity
ADD COLUMN IF NOT EXISTS batch_number TEXT,
ADD COLUMN IF NOT EXISTS breed TEXT,

-- Source
ADD COLUMN IF NOT EXISTS supplier TEXT,
ADD COLUMN IF NOT EXISTS hatchery TEXT,

-- Purchase
ADD COLUMN IF NOT EXISTS purchase_date DATE,

-- Financial
ADD COLUMN IF NOT EXISTS purchase_cost NUMERIC(14,2) DEFAULT 0 CHECK (purchase_cost >= 0),
ADD COLUMN IF NOT EXISTS transport_cost NUMERIC(14,2) DEFAULT 0 CHECK (transport_cost >= 0),

-- Housing
ADD COLUMN IF NOT EXISTS house TEXT,
ADD COLUMN IF NOT EXISTS pen TEXT,

-- Notes
ADD COLUMN IF NOT EXISTS notes TEXT,

-- Audit
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_flocks_farm_id ON flocks(farm_id);
CREATE INDEX IF NOT EXISTS idx_flocks_status ON flocks(status);
CREATE INDEX IF NOT EXISTS idx_flocks_batch_number ON flocks(batch_number);