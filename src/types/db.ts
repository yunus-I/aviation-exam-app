export type AppLanguage = "en" | "am";

export type RegistrationStatus =
  | "draft"
  | "submitted"
  | "pending_review"
  | "approved"
  | "rejected";

export type ReviewAction =
  | "submitted"
  | "approved"
  | "rejected"
  | "needs_update";

export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "true_false";

export type ExamMode = "practice" | "mock";

export type AttemptStatus =
  | "in_progress"
  | "submitted"
  | "auto_submitted"
  | "abandoned";

export type RegistrationStep =
  | "language"
  | "full_name"
  | "department"
  | "region"
  | "phone_number"
  | "password"
  | "receipt"
  | "completed";

export type DepartmentRecord = {
  id: string;
  slug: string;
  code: string;
  name_en: string;
  name_am: string | null;
  description_en: string | null;
  description_am: string | null;
  is_active: boolean;
};

export type RegionRecord = {
  id: string;
  slug: string;
  name_en: string;
  name_am: string | null;
  is_active: boolean;
};

export type CandidateRecord = {
  id: string;
  telegram_user_id: number;
  telegram_username: string | null;
  telegram_first_name: string | null;
  telegram_last_name: string | null;
  full_name: string | null;
  phone_number: string | null;
  password_hash: string | null;
  preferred_language: AppLanguage;
  selected_department_id: string | null;
  selected_region_id: string | null;
  current_registration_status: RegistrationStatus;
  last_approved_registration_id: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RegistrationSubmissionRecord = {
  id: string;
  candidate_id: string;
  submission_number: number;
  full_name: string;
  phone_number: string;
  password_hash: string;
  preferred_language: AppLanguage;
  department_id: string;
  region_id: string;
  payment_amount_etb: string;
  receipt_storage_path: string;
  receipt_telegram_file_id: string | null;
  receipt_file_name: string | null;
  receipt_mime_type: string | null;
  receipt_uploaded_at: string;
  telegram_user_id: number;
  telegram_username: string | null;
  status: RegistrationStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by_admin_id: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
};

export type RegistrationDraftRecord = {
  id: string;
  candidate_id: string;
  current_step: RegistrationStep;
  selected_language: AppLanguage | null;
  full_name: string | null;
  department_id: string | null;
  region_id: string | null;
  phone_number: string | null;
  password_hash: string | null;
  receipt_storage_path: string | null;
  receipt_telegram_file_id: string | null;
  receipt_file_name: string | null;
  receipt_mime_type: string | null;
  receipt_uploaded_at: string | null;
  submitted_registration_id: string | null;
  created_at: string;
  updated_at: string;
};

export type QuestionRecord = {
  id: string;
  question_bank_id: string;
  department_id: string | null;
  topic_id: string | null;
  source_label: string | null;
  source_year: number | null;
  question_type: QuestionType;
  prompt_en: string;
  prompt_am: string | null;
  explanation_en: string | null;
  explanation_am: string | null;
  difficulty_level: number;
  points: string;
  is_active: boolean;
  created_by_admin_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ExamSetRecord = {
  id: string;
  slug: string;
  title_en: string;
  title_am: string | null;
  description_en: string | null;
  description_am: string | null;
  department_id: string;
  topic_id: string | null;
  mode: ExamMode;
  duration_minutes: number;
  total_questions: number;
  total_points: string;
  passing_score: string | null;
  allow_question_shuffle: boolean;
  allow_option_shuffle: boolean;
  is_published: boolean;
  created_by_admin_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
