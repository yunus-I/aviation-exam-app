-- Make question_bank_id optional for the simplified admin
alter table public.questions alter column question_bank_id drop not null;

-- Add question_num for department-level question numbering
alter table public.questions add column if not exists question_num integer;

-- Add duration_minutes (how long a student gets for this question)
alter table public.questions add column if not exists duration_minutes integer default 2;
