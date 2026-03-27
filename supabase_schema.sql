-- ============================================================
--  VoltFix — Supabase Database Schema
--  Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Enable UUID extension (already on by default in Supabase) ──
create extension if not exists "uuid-ossp";


-- ── 2. inventory_items ────────────────────────────────────────────
create table public.inventory_items (
  id                   uuid primary key default uuid_generate_v4(),
  name                 text not null,
  quantity             integer not null default 0 check (quantity >= 0),
  price_ksh            numeric(10, 2) default 0,
  low_stock_threshold  integer default 5,
  created_at           timestamptz default now()
);

-- Index for name search
create index on public.inventory_items (name);


-- ── 3. repair_jobs ────────────────────────────────────────────────
create table public.repair_jobs (
  id                   uuid primary key default uuid_generate_v4(),
  customer_name        text not null,
  phone                text,
  device_type          text not null,
  problem_description  text not null,
  service_cost_ksh     numeric(10, 2) not null default 0,
  status               text not null default 'pending'
                         check (status in ('pending','in_progress','completed','cancelled')),
  created_at           timestamptz default now(),
  completed_at         timestamptz
);

-- Indexes for common filter patterns
create index on public.repair_jobs (status);
create index on public.repair_jobs (created_at desc);


-- ── 4. job_parts (junction table) ────────────────────────────────
-- Tracks which parts were used in each repair job
create table public.job_parts (
  id                  uuid primary key default uuid_generate_v4(),
  job_id              uuid not null references public.repair_jobs(id) on delete cascade,
  inventory_item_id   uuid not null references public.inventory_items(id) on delete restrict,
  quantity_used       integer not null default 1 check (quantity_used > 0),
  created_at          timestamptz default now()
);

create index on public.job_parts (job_id);
create index on public.job_parts (inventory_item_id);


-- ── 5. payments ───────────────────────────────────────────────────
create table public.payments (
  id               uuid primary key default uuid_generate_v4(),
  job_id           uuid not null references public.repair_jobs(id) on delete cascade,
  amount_paid_ksh  numeric(10, 2) not null check (amount_paid_ksh > 0),
  payment_method   text not null default 'cash'
                     check (payment_method in ('cash', 'mpesa')),
  paid_at          timestamptz default now()
);

create index on public.payments (job_id);
create index on public.payments (paid_at desc);


-- ── 6. Row Level Security (RLS) ──────────────────────────────────
-- Enable RLS on all tables — only authenticated users can access data

alter table public.inventory_items enable row level security;
alter table public.repair_jobs     enable row level security;
alter table public.job_parts       enable row level security;
alter table public.payments        enable row level security;

-- Policy: authenticated users can do anything
create policy "Authenticated full access" on public.inventory_items
  for all using (auth.role() = 'authenticated');

create policy "Authenticated full access" on public.repair_jobs
  for all using (auth.role() = 'authenticated');

create policy "Authenticated full access" on public.job_parts
  for all using (auth.role() = 'authenticated');

create policy "Authenticated full access" on public.payments
  for all using (auth.role() = 'authenticated');



