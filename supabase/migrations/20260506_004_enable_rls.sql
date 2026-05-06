-- Enable Row Level Security (RLS) on all tables to prevent unauthorized public access
-- Since we use the service_role key in our secure Next.js API routes, 
-- we do NOT need to create any public policies.
-- By default, enabling RLS without policies denies all access to the 'anon' and 'authenticated' roles.

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

-- No policies are added below intentionally.
-- Only the secure Next.js backend (using service_role key) will interact with the database.
