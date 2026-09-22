-- ============================================================
-- PoultryOps Demo Programme
-- Migration 007 - Demo Visitors
--
-- Records WHO is using the EXISTING shared Demo account
-- (demo@poultryops.app on the existing DEMO-001 farm).
--
-- This migration is additive only:
--   - no existing table is modified
--   - no existing row is modified
--   - the Demo farm, its owner, its profile, its farm_users
--     row and its subscription are untouched
--
-- No credentials of any kind are stored here.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.demo_visitors (

    id uuid primary key default gen_random_uuid(),

    -- Opaque, browser-stored visitor identity.
    --
    -- The shared Demo authentication account cannot distinguish one
    -- visitor from another, so a visitor token is issued on first
    -- access, stored in the visitor's browser, and reused on repeat
    -- access instead of creating another visitor record.
    visitor_token uuid not null default gen_random_uuid(),

    full_name text not null,

    phone text not null,

    -- Existing PoultryOps Demo Farm (DEMO-001).
    demo_farm_id uuid not null
        references public.farms(id)
        on delete cascade,

    first_access_at timestamptz not null default now(),

    last_access_at timestamptz not null default now(),

    access_count integer not null default 1,

    created_at timestamptz not null default now(),

    constraint demo_visitors_access_count_check
        check (access_count >= 1)
);

-- Duplicate protection for repeat access from the same browser.
create unique index if not exists idx_demo_visitors_visitor_token
on public.demo_visitors(visitor_token);

-- Admin listing is newest-first.
create index if not exists idx_demo_visitors_first_access_at
on public.demo_visitors(first_access_at desc);

create index if not exists idx_demo_visitors_last_access_at
on public.demo_visitors(last_access_at desc);

-- Admin search by phone.
create index if not exists idx_demo_visitors_phone
on public.demo_visitors(phone);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
--
-- Demo visitor information is internal only.
--
-- No policies are created, so anonymous and authenticated browser
-- clients cannot read or write this table. The only access path is
-- the server-side service-role client (lib/supabase-admin.ts) used
-- by the Demo capture endpoint and the Admin Control Centre.
-- ------------------------------------------------------------

alter table public.demo_visitors enable row level security;
