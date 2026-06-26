-- Simplify questions table: remove points and difficulty_level
alter table public.questions
  drop column if exists difficulty_level,
  drop column if exists points;

-- Remove point-related columns from exam_sets
alter table public.exam_sets
  drop column if exists total_points,
  drop column if exists passing_score;

-- Remove points_override from exam_set_questions
alter table public.exam_set_questions
  drop column if exists points_override;

-- Remove score columns from exam_attempts
alter table public.exam_attempts
  drop column if exists score,
  drop column if exists max_score,
  drop column if exists correct_count,
  drop column if exists incorrect_count,
  drop column if exists unanswered_count;
