create extension if not exists "uuid-ossp";

create table if not exists public.leads (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  segment text,
  category text,
  phone text,
  whatsapp text,
  email text,
  website text,
  instagram text,
  facebook text,
  city text,
  state text,
  address text,
  rating real,
  reviews_count integer default 0,
  followers integer default 0,
  description text,
  gmaps_link text,
  latitude real,
  longitude real,
  status text not null default 'Novo Lead',
  opportunity_score integer not null default 0 check (opportunity_score between 0 and 100),
  has_website integer not null default 0,
  website_analysis jsonb default '{}'::jsonb,
  social_analysis jsonb default '{}'::jsonb,
  ai_report text,
  first_message text,
  owner text,
  value_negotiated numeric(12,2) default 0,
  next_action text,
  notes text,
  schedule text,
  reviews jsonb default '[]'::jsonb,
  gallery jsonb default '[]'::jsonb,
  first_contact_date timestamptz,
  last_contact_date timestamptz,
  history jsonb default '[]'::jsonb,
  proposal_text text,
  proposal_sent boolean default false,
  labels jsonb default '[]'::jsonb,
  probability integer default 50 check (probability between 0 and 100),
  next_contact_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_name_city_unique unique (name, city)
);

create table if not exists public.follow_ups (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  sequence_day integer,
  message text,
  status text not null default 'Agendado',
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_city_idx on public.leads(city);
create index if not exists leads_segment_idx on public.leads(segment);
create index if not exists leads_status_created_idx on public.leads(status, created_at desc);
create index if not exists leads_opportunity_idx on public.leads(opportunity_score desc);
create index if not exists follow_ups_scheduled_idx on public.follow_ups(status, scheduled_for);
create index if not exists follow_ups_lead_id_idx on public.follow_ups(lead_id);

alter table public.leads enable row level security;
alter table public.follow_ups enable row level security;
alter table public.settings enable row level security;

revoke all on table public.leads, public.follow_ups, public.settings from anon, authenticated;
grant select, insert, update, delete on table public.leads, public.follow_ups, public.settings to service_role;
