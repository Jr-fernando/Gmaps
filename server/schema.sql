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
  instagram_link text,
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

create table if not exists public.ai_generations (
  id uuid primary key default extensions.uuid_generate_v4(),
  purpose text not null,
  prompt_hash text,
  model text not null,
  lead_ids jsonb not null default '[]'::jsonb,
  status text not null default 'pending',
  result jsonb not null default '{}'::jsonb,
  token_usage jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.outreach_messages (
  id uuid primary key default extensions.uuid_generate_v4(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  generation_id uuid references public.ai_generations(id) on delete set null,
  channel text not null check (channel in ('email','whatsapp','instagram')),
  recipient text,
  subject text,
  message text not null,
  status text not null default 'draft' check (status in ('draft','approved','sent','failed','handed_off','cancelled')),
  provider text,
  external_id text,
  requires_approval boolean not null default true,
  scheduled_for timestamptz,
  sent_at timestamptz,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_generations enable row level security;
alter table public.outreach_messages enable row level security;
create index if not exists outreach_messages_status_created_idx on public.outreach_messages(status, created_at desc);
create index if not exists outreach_messages_lead_idx on public.outreach_messages(lead_id);
create index if not exists outreach_messages_generation_idx on public.outreach_messages(generation_id);

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
