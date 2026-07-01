-- RLS policies for admin panel access.
-- Authenticated users with an email in admin_accounts can read/write all tables.

-- Helper function to check if the current user is an admin
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.admin_accounts
    where email = auth.jwt() ->> 'email'
      and is_active = true
  );
$$;

-- Departments
create policy "Admin full access on departments"
  on public.departments for all
  using (public.is_admin())
  with check (public.is_admin());

-- Topics
create policy "Admin full access on topics"
  on public.topics for all
  using (public.is_admin())
  with check (public.is_admin());

-- Question banks
create policy "Admin full access on question_banks"
  on public.question_banks for all
  using (public.is_admin())
  with check (public.is_admin());

-- Questions
create policy "Admin full access on questions"
  on public.questions for all
  using (public.is_admin())
  with check (public.is_admin());

-- Question options
create policy "Admin full access on question_options"
  on public.question_options for all
  using (public.is_admin())
  with check (public.is_admin());

-- Question media
create policy "Admin full access on question_media"
  on public.question_media for all
  using (public.is_admin())
  with check (public.is_admin());

-- Exam sets
create policy "Admin full access on exam_sets"
  on public.exam_sets for all
  using (public.is_admin())
  with check (public.is_admin());

-- Exam set questions
create policy "Admin full access on exam_set_questions"
  on public.exam_set_questions for all
  using (public.is_admin())
  with check (public.is_admin());

-- Candidates (read-only for admins)
create policy "Admin read access on candidates"
  on public.candidates for select
  using (public.is_admin());

-- Exam attempts (read-only for admins)
create policy "Admin read access on exam_attempts"
  on public.exam_attempts for select
  using (public.is_admin());

-- Attempt answers (read-only for admins)
create policy "Admin read access on attempt_answers"
  on public.attempt_answers for select
  using (public.is_admin());

-- Registrations (read-only for admins)
create policy "Admin read access on registration_submissions"
  on public.registration_submissions for select
  using (public.is_admin());

-- Admin accounts (read-only for non-super-admins)
create policy "Admin read access on admin_accounts"
  on public.admin_accounts for select
  using (public.is_admin());
