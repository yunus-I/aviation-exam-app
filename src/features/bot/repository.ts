// @ts-nocheck
import type { User } from "grammy/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AppLanguage } from "@/types/db";
import type {
  BotCandidate,
  LookupOption,
  RegistrationDraft,
  RegistrationStep,
  RegistrationSummary,
} from "@/features/bot/types";

type DraftPatch = Partial<{
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
  last_bot_message_id: number | null;
  last_user_message_id: number | null;
  submitted_registration_id: string | null;
}>;

function mapCandidate(row: Record<string, unknown>): BotCandidate {
  return {
    id: String(row.id),
    telegram_user_id: Number(row.telegram_user_id),
    telegram_username: (row.telegram_username as string | null) ?? null,
    telegram_first_name: (row.telegram_first_name as string | null) ?? null,
    telegram_last_name: (row.telegram_last_name as string | null) ?? null,
    current_registration_status: row.current_registration_status as BotCandidate["current_registration_status"],
    preferred_language: row.preferred_language as AppLanguage,
  };
}

function mapDraft(row: Record<string, unknown>): RegistrationDraft {
  return {
    id: String(row.id),
    candidate_id: String(row.candidate_id),
    current_step: row.current_step as RegistrationStep,
    selected_language: (row.selected_language as AppLanguage | null) ?? null,
    full_name: (row.full_name as string | null) ?? null,
    department_id: (row.department_id as string | null) ?? null,
    region_id: (row.region_id as string | null) ?? null,
    phone_number: (row.phone_number as string | null) ?? null,
    password_hash: (row.password_hash as string | null) ?? null,
    receipt_storage_path: (row.receipt_storage_path as string | null) ?? null,
    receipt_telegram_file_id:
      (row.receipt_telegram_file_id as string | null) ?? null,
    receipt_file_name: (row.receipt_file_name as string | null) ?? null,
    receipt_mime_type: (row.receipt_mime_type as string | null) ?? null,
    receipt_uploaded_at: (row.receipt_uploaded_at as string | null) ?? null,
    submitted_registration_id:
      (row.submitted_registration_id as string | null) ?? null,
  };
}

export class BotRepository {
  private readonly supabase = getSupabaseAdminClient();

  async ensureCandidate(user: User) {
    const existing = await this.supabase
      .from("candidates")
      .select("*")
      .eq("telegram_user_id", user.id)
      .maybeSingle();

    if (existing.error) {
      throw existing.error;
    }

    if (existing.data) {
      const updated = await this.supabase
        .from("candidates")
        // @ts-ignore
        .update({
          telegram_username: user.username ?? null,
          telegram_first_name: user.first_name ?? null,
          telegram_last_name: user.last_name ?? null,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", (existing.data as any).id)
        .select("*")
        .single();

      if (updated.error) {
        throw updated.error;
      }

      return mapCandidate(updated.data);
    }

    const created = await this.supabase
      .from("candidates")
      .insert({
        telegram_user_id: user.id,
        telegram_username: user.username ?? null,
        telegram_first_name: user.first_name ?? null,
        telegram_last_name: user.last_name ?? null,
        last_seen_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (created.error) {
      throw created.error;
    }

    return mapCandidate(created.data);
  }

  async getDraft(candidateId: string) {
    const result = await this.supabase
      .from("registration_drafts")
      .select("*")
      .eq("candidate_id", candidateId)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      return null;
    }

    return mapDraft(result.data);
  }

  async startDraft(candidateId: string) {
    const result = await this.supabase
      .from("registration_drafts")
      .upsert(
        {
          candidate_id: candidateId,
          current_step: "language",
          selected_language: null,
          full_name: null,
          department_id: null,
          region_id: null,
          phone_number: null,
          password_hash: null,
          receipt_storage_path: null,
          receipt_telegram_file_id: null,
          receipt_file_name: null,
          receipt_mime_type: null,
          receipt_uploaded_at: null,
          submitted_registration_id: null,
        },
        { onConflict: "candidate_id" },
      )
      .select("*")
      .single();

    if (result.error) {
      throw result.error;
    }

    return mapDraft(result.data);
  }

  async updateDraft(candidateId: string, patch: DraftPatch) {
    const result = await this.supabase
      .from("registration_drafts")
      .update(patch)
      .eq("candidate_id", candidateId)
      .select("*")
      .single();

    if (result.error) {
      throw result.error;
    }

    return mapDraft(result.data);
  }

  async listDepartments(language: AppLanguage): Promise<LookupOption[]> {
    const result = await this.supabase
      .from("departments")
      .select("id, slug, name_en, name_am")
      .eq("is_active", true)
      .order("name_en", { ascending: true });

    if (result.error) {
      throw result.error;
    }

    return (result.data ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      label: row.name_en,
      secondaryLabel: row.name_am,
    }));
  }

  async listRegions(): Promise<LookupOption[]> {
    const result = await this.supabase
      .from("regions")
      .select("id, slug, name_en, name_am")
      .eq("is_active", true)
      .order("name_en", { ascending: true });

    if (result.error) {
      throw result.error;
    }

    return (result.data ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      label: row.name_en,
      secondaryLabel: row.name_am,
    }));
  }

  async findDepartmentById(departmentId: string) {
    const result = await this.supabase
      .from("departments")
      .select("id, slug, name_en, name_am")
      .eq("id", departmentId)
      .single();

    if (result.error) {
      throw result.error;
    }

    return {
      id: result.data.id,
      slug: result.data.slug,
      label: result.data.name_en,
      secondaryLabel: result.data.name_am,
    } satisfies LookupOption;
  }

  async findRegionById(regionId: string) {
    const result = await this.supabase
      .from("regions")
      .select("id, slug, name_en, name_am")
      .eq("id", regionId)
      .single();

    if (result.error) {
      throw result.error;
    }

    return {
      id: result.data.id,
      slug: result.data.slug,
      label: result.data.name_en,
      secondaryLabel: result.data.name_am,
    } satisfies LookupOption;
  }

  async submitDraft(candidate: BotCandidate, draft: RegistrationDraft) {
    if (
      !draft.selected_language ||
      !draft.full_name ||
      !draft.department_id ||
      !draft.region_id ||
      !draft.phone_number ||
      !draft.password_hash ||
      !draft.receipt_storage_path
    ) {
      throw new Error("Registration draft is incomplete.");
    }

    const countResult = await this.supabase
      .from("registration_submissions")
      .select("id", { count: "exact", head: true })
      .eq("candidate_id", candidate.id);

    if (countResult.error) {
      throw countResult.error;
    }

    const submissionNumber = (countResult.count ?? 0) + 1;

    const submissionResult = await this.supabase
      .from("registration_submissions")
      .insert({
        candidate_id: candidate.id,
        submission_number: submissionNumber,
        full_name: draft.full_name,
        phone_number: draft.phone_number,
        password_hash: draft.password_hash,
        preferred_language: draft.selected_language,
        department_id: draft.department_id,
        region_id: draft.region_id,
        receipt_storage_path: draft.receipt_storage_path,
        receipt_telegram_file_id: draft.receipt_telegram_file_id,
        receipt_file_name: draft.receipt_file_name,
        receipt_mime_type: draft.receipt_mime_type,
        receipt_uploaded_at: draft.receipt_uploaded_at ?? new Date().toISOString(),
        telegram_user_id: candidate.telegram_user_id,
        telegram_username: candidate.telegram_username,
        status: "pending_review",
      })
      .select("*")
      .single();

    if (submissionResult.error) {
      throw submissionResult.error;
    }

    const submission = submissionResult.data;

    const reviewResult = await this.supabase.from("registration_reviews").insert({
      registration_submission_id: submission.id,
      action: "submitted",
      note: "Submitted from Telegram bot registration flow.",
    });

    if (reviewResult.error) {
      throw reviewResult.error;
    }

    const candidateUpdate = await this.supabase
      .from("candidates")
      .update({
        full_name: draft.full_name,
        phone_number: draft.phone_number,
        password_hash: draft.password_hash,
        preferred_language: draft.selected_language,
        selected_department_id: draft.department_id,
        selected_region_id: draft.region_id,
        current_registration_status: "pending_review",
      })
      .eq("id", candidate.id);

    if (candidateUpdate.error) {
      throw candidateUpdate.error;
    }

    await this.updateDraft(candidate.id, {
      current_step: "completed",
      submitted_registration_id: submission.id,
    });

    const [department, region] = await Promise.all([
      this.findDepartmentById(draft.department_id),
      this.findRegionById(draft.region_id),
    ]);

    return {
      submissionId: submission.id,
      candidateId: candidate.id,
      fullName: submission.full_name,
      phoneNumber: submission.phone_number,
      language: submission.preferred_language,
      departmentLabel: department.label,
      regionLabel: region.label,
      telegramUserId: submission.telegram_user_id,
      telegramUsername: submission.telegram_username,
      receiptTelegramFileId: submission.receipt_telegram_file_id,
      receiptStoragePath: submission.receipt_storage_path,
    } satisfies RegistrationSummary;
  }

  async isAdminTelegramUser(telegramUserId: number) {
    const result = await this.supabase
      .from("admin_accounts")
      .select("id")
      .eq("telegram_user_id", telegramUserId)
      .eq("is_active", true)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    return Boolean(result.data);
  }

  async getActiveAdminTelegramUserIds(): Promise<number[]> {
    const result = await this.supabase
      .from("admin_accounts")
      .select("telegram_user_id")
      .eq("is_active", true);

    if (result.error || !result.data) {
      return [];
    }

    return result.data
      .map((row: any) => Number(row.telegram_user_id))
      .filter((id: number) => !isNaN(id) && id > 0);
  }

  async getSubmissionForReview(submissionId: string) {
    const result = await this.supabase
      .from("registration_submissions")
      .select(
        `
        id,
        candidate_id,
        full_name,
        phone_number,
        preferred_language,
        telegram_user_id,
        telegram_username,
        receipt_storage_path,
        receipt_telegram_file_id,
        status,
        departments:department_id(name_en, name_am),
        regions:region_id(name_en, name_am)
      `,
      )
      .eq("id", submissionId)
      .single();

    if (result.error) {
      throw result.error;
    }

    const row = result.data as Record<string, any>;

    return {
      id: row.id as string,
      candidateId: row.candidate_id as string,
      fullName: row.full_name as string,
      phoneNumber: row.phone_number as string,
      preferredLanguage: row.preferred_language as AppLanguage,
      telegramUserId: Number(row.telegram_user_id),
      telegramUsername: (row.telegram_username as string | null) ?? null,
      receiptStoragePath: row.receipt_storage_path as string,
      receiptTelegramFileId: (row.receipt_telegram_file_id as string | null) ?? null,
      status: row.status as string,
      departmentLabel: row.departments?.name_en as string,
      regionLabel: row.regions?.name_en as string,
    };
  }

  async decideRegistrationReview(params: {
    submissionId: string;
    adminTelegramUserId: number;
    action: "approve" | "reject";
  }) {
    const admin = await this.supabase
      .from("admin_accounts")
      .select("id")
      .eq("telegram_user_id", params.adminTelegramUserId)
      .eq("is_active", true)
      .single();

    if (admin.error) {
      throw admin.error;
    }

    const submission = await this.getSubmissionForReview(params.submissionId);
    const now = new Date().toISOString();
    const nextStatus = params.action === "approve" ? "approved" : "rejected";

    const submissionUpdate = await this.supabase
      .from("registration_submissions")
      .update({
        status: nextStatus,
        reviewed_at: now,
        reviewed_by_admin_id: admin.data.id,
      })
      .eq("id", params.submissionId);

    if (submissionUpdate.error) {
      throw submissionUpdate.error;
    }

    const candidateUpdate = await this.supabase
      .from("candidates")
      .update({
        current_registration_status: nextStatus,
        approved_at: params.action === "approve" ? now : null,
        rejected_at: params.action === "reject" ? now : null,
        last_approved_registration_id:
          params.action === "approve" ? params.submissionId : null,
      })
      .eq("id", submission.candidateId);

    if (candidateUpdate.error) {
      throw candidateUpdate.error;
    }

    const reviewInsert = await this.supabase.from("registration_reviews").insert({
      registration_submission_id: params.submissionId,
      admin_account_id: admin.data.id,
      action: params.action === "approve" ? "approved" : "rejected",
    });

    if (reviewInsert.error) {
      throw reviewInsert.error;
    }

    return submission;
  }
}
