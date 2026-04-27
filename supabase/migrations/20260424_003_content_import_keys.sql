alter table public.question_banks
  add column if not exists import_key text unique;

alter table public.questions
  add column if not exists import_key text unique;

alter table public.exam_sets
  add column if not exists import_key text unique;
