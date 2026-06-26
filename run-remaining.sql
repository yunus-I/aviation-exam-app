-- =============================================
-- Migration 2: registration_drafts (idempotent)
-- =============================================
do $$ begin
  create type public.registration_step as enum (
    'language', 'full_name', 'department', 'region',
    'phone_number', 'password', 'receipt', 'completed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
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
exception when duplicate_table then null;
end $$;

do $$ begin
  create trigger registration_drafts_set_updated_at
    before update on public.registration_drafts
    for each row execute function public.set_updated_at();
exception when duplicate_object then null;
end $$;

create index if not exists idx_registration_drafts_current_step
  on public.registration_drafts(current_step);

-- =============================================
-- Migration 3: content import keys (idempotent)
-- =============================================
alter table public.question_banks
  add column if not exists import_key text unique;

alter table public.questions
  add column if not exists import_key text unique;

alter table public.exam_sets
  add column if not exists import_key text unique;

-- =============================================
-- Migration 4: enable RLS (idempotent)
-- =============================================
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_set_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Migration 5: simplify questions (idempotent)
-- =============================================
alter table public.questions
  drop column if exists difficulty_level,
  drop column if exists points;

alter table public.exam_sets
  drop column if exists total_points,
  drop column if exists passing_score;

alter table public.exam_set_questions
  drop column if exists points_override;

alter table public.exam_attempts
  drop column if exists score,
  drop column if exists max_score,
  drop column if exists correct_count,
  drop column if exists incorrect_count,
  drop column if exists unanswered_count;

-- =============================================
-- Seed: admin account (idempotent)
-- =============================================
insert into public.admin_accounts (
  telegram_user_id, telegram_username, display_name,
  is_super_admin, is_active
)
values (
  5827966050, 'kcyslo', 'Main Admin',
  true, true
)
on conflict (telegram_user_id) do update
set
  telegram_username = excluded.telegram_username,
  display_name = excluded.display_name,
  is_super_admin = excluded.is_super_admin,
  is_active = excluded.is_active;
