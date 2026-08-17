-- Migration: Add Model Exam 1 to topics table if not present
INSERT INTO public.topics (slug, name_en, is_active)
VALUES ('model-exam-1', 'Model Exam 1', true)
ON CONFLICT (slug) DO UPDATE
SET name_en = EXCLUDED.name_en, is_active = true;
