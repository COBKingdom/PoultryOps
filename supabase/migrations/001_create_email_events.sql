-- ============================================================
-- TrueOps Email Framework
-- Migration 001 - Email Events
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.email_events (

    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    event_type text not null,

    email text not null,

    sent_at timestamptz not null default now(),

    metadata jsonb
);

create index if not exists idx_email_events_user_event
on public.email_events(user_id, event_type);

create index if not exists idx_email_events_sent_at
on public.email_events(sent_at);