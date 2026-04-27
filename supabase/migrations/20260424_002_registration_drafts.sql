create type public.registration_step as enum (
  'language',
  'full_name',
  'department',
  'region',
  'phone_number',
  'password',
  'receipt',
  'completed'
);

create table public.registration_drafts (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null unique references public.candidates(id) on delete cascade,
  current_step public.registration_step not null default 'language',
  selected_language public.app_language,
  full_name text,
  department_id uuid references public.departments(id),
  region_id uuid references public.regions(id),
  phone_number text,
  password_hash text,
  receipt_storage_path text,
  receipt_telegram_file_id text,
  receipt_file_name text,
  receipt_mime_type text,
  receipt_uploaded_at timestamptz,
  last_bot_message_id bigint,
  last_user_message_id bigint,
  submitted_registration_id uuid references public.registration_submissions(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger registration_drafts_set_updated_at
before update on public.registration_drafts
for each row execute function public.set_updated_at();

create index idx_registration_drafts_current_step
  on public.registration_drafts(current_step);
