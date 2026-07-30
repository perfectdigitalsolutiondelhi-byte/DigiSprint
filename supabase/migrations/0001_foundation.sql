-- DigiSprint Version 1.0 foundation schema
create extension if not exists pgcrypto;

create type public.business_role as enum ('owner', 'manager', 'editor', 'viewer');
create type public.setup_status as enum ('started', 'business_complete', 'brand_complete', 'complete');
create type public.post_status as enum ('generating', 'draft', 'ready', 'scheduled', 'published', 'archived', 'failed');
create type public.ai_job_status as enum ('queued', 'running', 'succeeded', 'failed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  preferred_language text not null default 'en',
  timezone text not null default 'Asia/Kolkata',
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  business_type text,
  industry text,
  description text,
  city text,
  state text,
  country text not null default 'India',
  phone text,
  whatsapp text,
  website text,
  setup_status public.setup_status not null default 'started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.business_role not null default 'viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create table public.brand_kits (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  logo_path text,
  primary_color text,
  secondary_color text,
  tone text,
  default_cta text,
  language_preferences text[] not null default array['en']::text[],
  banned_terms text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_preferences (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  platforms text[] not null default array['instagram']::text[],
  content_goals text[] not null default array[]::text[],
  target_audience text,
  posts_per_week smallint not null default 3 check (posts_per_week between 1 and 14),
  festival_regions text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  source_type text not null default 'manual',
  source_id uuid,
  title text,
  caption text,
  hashtags text[] not null default array[]::text[],
  platform text not null default 'instagram',
  language text not null default 'en',
  tone text,
  status public.post_status not null default 'draft',
  scheduled_for timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.post_versions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  caption text,
  hashtags text[] not null default array[]::text[],
  creative_config jsonb not null default '{}'::jsonb,
  generation_id uuid,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (post_id, version_number)
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  bucket text not null,
  object_path text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size >= 0),
  width integer,
  height integer,
  checksum text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (bucket, object_path)
);

create table public.post_assets (
  post_id uuid not null references public.posts(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  usage_type text not null default 'creative',
  primary key (post_id, asset_id)
);

create table public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete restrict,
  job_type text not null,
  provider text,
  model text,
  status public.ai_job_status not null default 'queued',
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error_code text,
  idempotency_key text not null,
  input_tokens integer,
  output_tokens integer,
  provider_cost numeric(12,6),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  unique (business_id, idempotency_key)
);

create index businesses_owner_idx on public.businesses(owner_id);
create index business_members_user_idx on public.business_members(user_id) where is_active;
create index posts_business_created_idx on public.posts(business_id, created_at desc);
create index posts_business_status_idx on public.posts(business_id, status);
create index ai_jobs_business_created_idx on public.ai_jobs(business_id, created_at desc);
create index assets_business_idx on public.assets(business_id, created_at desc);

create or replace function public.is_business_member(target_business_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.business_members
    where business_id = target_business_id and user_id = auth.uid() and is_active
  );
$$;

create or replace function public.is_business_owner(target_business_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.business_members
    where business_id = target_business_id and user_id = auth.uid() and role = 'owner' and is_active
  );
$$;

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.brand_kits enable row level security;
alter table public.content_preferences enable row level security;
alter table public.posts enable row level security;
alter table public.post_versions enable row level security;
alter table public.assets enable row level security;
alter table public.post_assets enable row level security;
alter table public.ai_jobs enable row level security;

create policy "profiles read self" on public.profiles for select using (id = auth.uid());
create policy "profiles update self" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "business members read business" on public.businesses for select using (public.is_business_member(id));
create policy "owners update business" on public.businesses for update using (public.is_business_owner(id)) with check (public.is_business_owner(id));
create policy "members read membership" on public.business_members for select using (public.is_business_member(business_id));
create policy "members read brand kit" on public.brand_kits for select using (public.is_business_member(business_id));
create policy "owners manage brand kit" on public.brand_kits for all using (public.is_business_owner(business_id)) with check (public.is_business_owner(business_id));
create policy "members read content preferences" on public.content_preferences for select using (public.is_business_member(business_id));
create policy "owners manage content preferences" on public.content_preferences for all using (public.is_business_owner(business_id)) with check (public.is_business_owner(business_id));
create policy "members manage posts" on public.posts for all using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
create policy "members read post versions" on public.post_versions for select using (exists (select 1 from public.posts p where p.id = post_id and public.is_business_member(p.business_id)));
create policy "members create post versions" on public.post_versions for insert with check (exists (select 1 from public.posts p where p.id = post_id and public.is_business_member(p.business_id)));
create policy "members manage assets" on public.assets for all using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
create policy "members read post assets" on public.post_assets for select using (exists (select 1 from public.posts p where p.id = post_id and public.is_business_member(p.business_id)));
create policy "members manage post assets" on public.post_assets for all using (exists (select 1 from public.posts p where p.id = post_id and public.is_business_member(p.business_id))) with check (exists (select 1 from public.posts p where p.id = post_id and public.is_business_member(p.business_id)));
create policy "members read ai jobs" on public.ai_jobs for select using (public.is_business_member(business_id));
