import type { AppLanguage, RegistrationStatus } from "@/types/db";

export type RegistrationStep =
  | "language"
  | "full_name"
  | "department"
  | "region"
  | "phone_number"
  | "password"
  | "receipt"
  | "completed";

export type BotCandidate = {
  id: string;
  telegram_user_id: number;
  telegram_username: string | null;
  telegram_first_name: string | null;
  telegram_last_name: string | null;
  current_registration_status: RegistrationStatus;
  preferred_language: AppLanguage;
};

export type RegistrationDraft = {
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
};

export type LookupOption = {
  id: string;
  slug: string;
  label: string;
  secondaryLabel: string | null;
};

export type RegistrationSummary = {
  submissionId: string;
  candidateId: string;
  fullName: string;
  phoneNumber: string;
  language: AppLanguage;
  departmentLabel: string;
  regionLabel: string;
  telegramUserId: number;
  telegramUsername: string | null;
  receiptTelegramFileId: string | null;
  receiptStoragePath: string;
};
