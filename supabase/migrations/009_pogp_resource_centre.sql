
-- ============================================================
-- PoultryOps POGP Resource Centre
-- Migration: 009_pogp_resource_centre.sql
-- Additive change: does not modify existing POGP tables.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pogp_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',

    category TEXT NOT NULL CHECK (
        category IN (
            'starter_pack',
            'sales_toolkit',
            'product_training',
            'marketing_materials',
            'live_sales_documents',
            'news_updates'
        )
    ),

    resource_type TEXT NOT NULL CHECK (
        resource_type IN (
            'document',
            'pdf',
            'video',
            'link',
            'image',
            'other'
        )
    ),

    -- Supabase Storage object path; bucket remains private.
    storage_path TEXT,

    -- Optional external URL, validated again by the API.
    external_url TEXT,

    status TEXT NOT NULL DEFAULT 'draft' CHECK (
        status IN ('draft', 'published', 'archived')
    ),

    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pogp_resources_title_not_blank
        CHECK (length(trim(title)) > 0),

    CONSTRAINT pogp_resources_has_source
        CHECK (
            storage_path IS NOT NULL
            OR external_url IS NOT NULL
            OR status = 'draft'
        )
);

CREATE INDEX IF NOT EXISTS idx_pogp_resources_status_category
    ON public.pogp_resources (status, category);

CREATE INDEX IF NOT EXISTS idx_pogp_resources_published_at
    ON public.pogp_resources (published_at DESC);

ALTER TABLE public.pogp_resources ENABLE ROW LEVEL SECURITY;

-- No direct client policies are created.
-- Access is mediated by server APIs which explicitly authorize
-- the active POGP partner or active platform administrator.

-- Create a private bucket for partner-only resource files.
INSERT INTO storage.buckets (id, name, public)
VALUES ('pogp-resources', 'pogp-resources', FALSE)
ON CONFLICT (id)
DO UPDATE SET public = FALSE;
