// @ts-nocheck
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AppLanguage, RegistrationStatus } from "@/types/db";

export type MiniAppCandidateSession = {
  candidateId: string;
  telegramUserId: number;
  fullName: string | null;
  preferredLanguage: AppLanguage;
  registrationStatus: RegistrationStatus;
  departmentId: string | null;
  departmentName: string | null;
  regionName: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
};

export class AuthRepository {
  private readonly supabase = getSupabaseAdminClient();

  async getCandidateSessionByTelegramUserId(telegramUserId: number) {
    const result = await this.supabase
      .from("candidates")
      .select(
        `
        id,
        telegram_user_id,
        full_name,
        preferred_language,
        current_registration_status,
        selected_department_id,
        approved_at,
        rejected_at,
        departments:selected_department_id(name_en),
        regions:selected_region_id(name_en)
      `,
      )
      .eq("telegram_user_id", telegramUserId)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      return null;
    }

    const row = result.data as Record<string, any>;

    return {
      candidateId: row.id as string,
      telegramUserId: Number(row.telegram_user_id),
      fullName: (row.full_name as string | null) ?? null,
      preferredLanguage: row.preferred_language as AppLanguage,
      registrationStatus: row.current_registration_status as RegistrationStatus,
      departmentId: (row.selected_department_id as string | null) ?? null,
      departmentName: (row.departments?.name_en as string | null) ?? null,
      regionName: (row.regions?.name_en as string | null) ?? null,
      approvedAt: (row.approved_at as string | null) ?? null,
      rejectedAt: (row.rejected_at as string | null) ?? null,
    } satisfies MiniAppCandidateSession;
  }
}
