create extension if not exists pgcrypto;
create type public.app_language as enum ('en', 'am');
create type public.registration_status as enum ('draft', 'submitted', 'pending_review', 'approved', 'rejected');
create type public.review_action as enum ('submitted', 'approved', 'rejected', 'needs_update');
create type public.question_type as enum ('single_choice', 'multiple_choice', 'true_false');
create type public.exam_mode as enum ('practice', 'mock');
create type public.attempt_status as enum ('in_progress', 'submitted', 'auto_submitted', 'abandoned');
create type public.media_kind as enum ('image');
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  code text not null unique,
  name_en text not null,
  name_am text,
  description_en text,
  description_am text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.regions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null unique,
  name_am text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.admin_accounts (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null unique,
  telegram_username text,
  display_name text not null,
  is_super_admin boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null unique,
  telegram_username text,
  telegram_first_name text,
  telegram_last_name text,
  full_name text,
  phone_number text,
  password_hash text,
  preferred_language public.app_language not null default 'en',
  selected_department_id uuid references public.departments(id),
  selected_region_id uuid references public.regions(id),
  current_registration_status public.registration_status not null default 'draft',
  last_approved_registration_id uuid,
  approved_at timestamptz,
  rejected_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.registration_submissions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  submission_number integer not null,
  full_name text not null,
  phone_number text not null,
  password_hash text not null,
  preferred_language public.app_language not null,
  department_id uuid not null references public.departments(id),
  region_id uuid not null references public.regions(id),
  payment_amount_etb numeric(10,2) not null default 200.00,
  receipt_storage_path text not null,
  receipt_telegram_file_id text,
  receipt_file_name text,
  receipt_mime_type text,
  receipt_uploaded_at timestamptz not null default timezone('utc', now()),
  telegram_user_id bigint not null,
  telegram_username text,
  status public.registration_status not null default 'submitted',
  submitted_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewed_by_admin_id uuid references public.admin_accounts(id),
  review_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (candidate_id, submission_number)
);
create table public.registration_reviews (
  id uuid primary key default gen_random_uuid(),
  registration_submission_id uuid not null references public.registration_submissions(id) on delete cascade,
  admin_account_id uuid references public.admin_accounts(id),
  action public.review_action not null,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);
alter table public.candidates
  add constraint candidates_last_approved_registration_fk
  foreign key (last_approved_registration_id)
  references public.registration_submissions(id);
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_am text,
  description_en text,
  description_am text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.question_banks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_en text not null,
  title_am text,
  description_en text,
  description_am text,
  department_id uuid references public.departments(id),
  topic_id uuid references public.topics(id),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  question_bank_id uuid not null references public.question_banks(id) on delete cascade,
  department_id uuid references public.departments(id),
  topic_id uuid references public.topics(id),
  source_label text,
  source_year integer,
  question_type public.question_type not null default 'single_choice',
  prompt_en text not null,
  prompt_am text,
  explanation_en text,
  explanation_am text,
  difficulty_level smallint not null default 1 check (difficulty_level between 1 and 5),
  points numeric(8,2) not null default 1.00,
  is_active boolean not null default true,
  created_by_admin_id uuid references public.admin_accounts(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.question_media (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  media_kind public.media_kind not null default 'image',
  storage_path text not null,
  alt_text_en text,
  alt_text_am text,
  sort_order integer not null default 1,
  created_at timestamptz not null default timezone('utc', now())
);
create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_key text not null,
  option_text_en text not null,
  option_text_am text,
  is_correct boolean not null default false,
  sort_order integer not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  unique (question_id, option_key),
  unique (question_id, sort_order)
);
create table public.exam_sets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_en text not null,
  title_am text,
  description_en text,
  description_am text,
  department_id uuid not null references public.departments(id),
  topic_id uuid references public.topics(id),
  mode public.exam_mode not null,
  duration_minutes integer not null check (duration_minutes > 0),
  total_questions integer not null default 0 check (total_questions >= 0),
  total_points numeric(10,2) not null default 0.00,
  passing_score numeric(10,2),
  allow_question_shuffle boolean not null default true,
  allow_option_shuffle boolean not null default true,
  is_published boolean not null default false,
  created_by_admin_id uuid references public.admin_accounts(id),
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.exam_set_questions (
  id uuid primary key default gen_random_uuid(),
  exam_set_id uuid not null references public.exam_sets(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  sort_order integer not null,
  points_override numeric(8,2),
  created_at timestamptz not null default timezone('utc', now()),
  unique (exam_set_id, question_id),
  unique (exam_set_id, sort_order)
);
create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  exam_set_id uuid not null references public.exam_sets(id) on delete restrict,
  department_id uuid not null references public.departments(id),
  status public.attempt_status not null default 'in_progress',
  started_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  score numeric(10,2),
  max_score numeric(10,2),
  correct_count integer,
  incorrect_count integer,
  unanswered_count integer,
  time_spent_seconds integer not null default 0,
  last_activity_at timestamptz not null default timezone('utc', now()),
  question_order jsonb,
  option_order jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  exam_attempt_id uuid not null references public.exam_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  selected_option_ids uuid[] not null default '{}',
  is_flagged boolean not null default false,
  is_answered boolean not null default false,
  is_correct boolean,
  answered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (exam_attempt_id, question_id)
);
create index idx_candidates_registration_status
  on public.candidates(current_registration_status);
create index idx_registration_submissions_candidate_id
  on public.registration_submissions(candidate_id);
create index idx_registration_submissions_status
  on public.registration_submissions(status);
create index idx_registration_reviews_submission_id
  on public.registration_reviews(registration_submission_id);
create index idx_questions_bank_id
  on public.questions(question_bank_id);
create index idx_questions_department_topic
  on public.questions(department_id, topic_id);
create index idx_question_media_question_id
  on public.question_media(question_id, sort_order);
create index idx_question_options_question_id
  on public.question_options(question_id, sort_order);
create index idx_exam_sets_department_mode
  on public.exam_sets(department_id, mode);
create index idx_exam_set_questions_exam_set_id
  on public.exam_set_questions(exam_set_id, sort_order);
create index idx_exam_attempts_candidate_id
  on public.exam_attempts(candidate_id, started_at desc);
create index idx_attempt_answers_attempt_id
  on public.attempt_answers(exam_attempt_id);
create trigger departments_set_updated_at
before update on public.departments
for each row execute function public.set_updated_at();
create trigger regions_set_updated_at
before update on public.regions
for each row execute function public.set_updated_at();
create trigger admin_accounts_set_updated_at
before update on public.admin_accounts
for each row execute function public.set_updated_at();
create trigger candidates_set_updated_at
before update on public.candidates
for each row execute function public.set_updated_at();
create trigger registration_submissions_set_updated_at
before update on public.registration_submissions
for each row execute function public.set_updated_at();
create trigger topics_set_updated_at
before update on public.topics
for each row execute function public.set_updated_at();
create trigger question_banks_set_updated_at
before update on public.question_banks
for each row execute function public.set_updated_at();
create trigger questions_set_updated_at
before update on public.questions
for each row execute function public.set_updated_at();
create trigger exam_sets_set_updated_at
before update on public.exam_sets
for each row execute function public.set_updated_at();
create trigger exam_attempts_set_updated_at
before update on public.exam_attempts
for each row execute function public.set_updated_at();
create trigger attempt_answers_set_updated_at
before update on public.attempt_answers
for each row execute function public.set_updated_at();
insert into public.departments (
  slug,
  code,
  name_en,
  name_am,
  description_en,
  description_am
)
values
  (
    'amt-maintenance',
    'AMT',
    'AMT Maintenance',
    'የአውሮፕላን ጥገና',
    'Mechanical reasoning, maintenance-oriented, and technical entrance preparation.',
    'የመካኒካል አስተሳሰብ፣ የጥገና አቅም እና ቴክኒካል የመግቢያ ዝግጅት።'
  ),
  (
    'cabin-crew',
    'CABIN',
    'Cabin Crew',
    'ካቢን ክሩ',
    'Customer-facing communication, reasoning, and service preparation.',
    'የደንበኛ አገልግሎት፣ ኮሙኒኬሽን እና አስተሳሰብ የመግቢያ ዝግጅት።'
  ),
  (
    'marketing',
    'MKT',
    'Marketing',
    'ማርኬቲንግ',
    'Business, communication, and quantitative entrance preparation.',
    'የንግድ፣ የኮሙኒኬሽን እና የቁጥር አስተሳሰብ የመግቢያ ዝግጅት።'
  ),
  (
    'pilot',
    'PILOT',
    'Pilot',
    'ፓይለት',
    'Math, aptitude, and aviation-oriented entrance preparation.',
    'የሂሳብ፣ አፕቲቱድ እና የአቪዬሽን የመግቢያ ዝግጅት።'
  );
insert into public.regions (slug, name_en, name_am)
values
  ('addis-ababa', 'Addis Ababa', 'አዲስ አበባ'),
  ('afar', 'Afar', 'አፋር'),
  ('amhara', 'Amhara', 'አማራ'),
  ('benishangul-gumuz', 'Benishangul-Gumuz', 'ቤንሻንጉል ጉሙዝ'),
  ('central-ethiopia', 'Central Ethiopia', 'ማዕከላዊ ኢትዮጵያ'),
  ('dire-dawa', 'Dire Dawa', 'ድሬዳዋ'),
  ('gambela', 'Gambela', 'ጋምቤላ'),
  ('harari', 'Harari', 'ሐረሪ'),
  ('oromia', 'Oromia', 'ኦሮሚያ'),
  ('sidama', 'Sidama', 'ሲዳማ'),
  ('somali', 'Somali', 'ሶማሊ'),
  ('south-ethiopia', 'South Ethiopia', 'ደቡብ ኢትዮጵያ'),
  ('south-west-ethiopia-peoples', 'South West Ethiopia Peoples', 'ደቡብ ምዕራብ ኢትዮጵያ ሕዝቦች'),
  ('tigray', 'Tigray', 'ትግራይ');
insert into public.topics (
  slug,
  name_en,
  name_am,
  description_en,
  description_am
)
values
  (
    'mechanical-reasoning',
    'Mechanical Reasoning',
    'መካኒካል አስተሳሰብ',
    'Mechanical concepts and technical understanding.',
    'የመካኒካል ግንዛቤ እና ቴክኒካል አስተዋጽኦ።'
  ),
  (
    'aptitude',
    'Aptitude',
    'አፕቲቱድ',
    'General aptitude and entrance readiness questions.',
    'አጠቃላይ አፕቲቱድ እና የመግቢያ ዝግጅት ጥያቄዎች።'
  ),
  (
    'reasoning',
    'Reasoning',
    'ሎጂካል አስተሳሰብ',
    'Verbal and non-verbal reasoning practice.',
    'የቃላዊ እና የእይታ አስተሳሰብ ልምምድ።'
  ),
  (
    'mathematics',
    'Mathematics',
    'ሂሳብ',
    'Quantitative and problem-solving preparation.',
    'የቁጥር አስተሳሰብ እና የችግኝ ፍታት ዝግጅት።'
  ),
  (
    'english',
    'English',
    'እንግሊዝኛ',
    'Language comprehension and usage practice.',
    'የቋንቋ ግንዛቤ እና አጠቃቀም ልምምድ።'
  ),
  (
    'money-and-business',
    'Money and Business',
    'ገንዘብ እና ንግድ',
    'Basic money, commerce, and business entrance questions.',
    'መሠረታዊ የገንዘብ፣ የንግድ እና የቢዝነስ ጥያቄዎች።'
  );
-- Supabase-only storage bootstrap.
-- Plain PostgreSQL databases do not have the storage schema/table.
-- Create these buckets later inside Supabase when you move to production.;
