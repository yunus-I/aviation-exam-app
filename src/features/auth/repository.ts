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
  isAdmin: boolean;
};

export class AuthRepository {
  private readonly supabase = getSupabaseAdminClient();

  async getCandidateSessionByTelegramUserId(telegramUserId: number) {
    const adminCheck = await this.supabase
      .from("admin_accounts")
      .select("id, display_name")
      .eq("telegram_user_id", telegramUserId)
      .eq("is_active", true)
      .maybeSingle();

    const isAdmin = Boolean(adminCheck.data);

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
      if (isAdmin) {
        return {
          candidateId: `admin-${telegramUserId}`,
          telegramUserId,
          fullName: adminCheck.data?.display_name || "Admin",
          preferredLanguage: "en",
          registrationStatus: "approved",
          departmentId: "all",
          departmentName: "All Departments",
          regionName: null,
          approvedAt: new Date().toISOString(),
          rejectedAt: null,
          isAdmin: true,
        } satisfies MiniAppCandidateSession;
      }
      return null;
    }

    const row = result.data as Record<string, any>;

    return {
      candidateId: row.id as string,
      telegramUserId: Number(row.telegram_user_id),
      fullName: (row.full_name as string | null) ?? (isAdmin ? "Admin" : null),
      preferredLanguage: (row.preferred_language as AppLanguage) || "en",
      registrationStatus: isAdmin ? "approved" : (row.current_registration_status as RegistrationStatus),
      departmentId: (row.selected_department_id as string | null) ?? (isAdmin ? "all" : null),
      departmentName: (row.departments?.name_en as string | null) ?? (isAdmin ? "All Departments" : null),
      regionName: (row.regions?.name_en as string | null) ?? null,
      approvedAt: (row.approved_at as string | null) ?? null,
      rejectedAt: (row.rejected_at as string | null) ?? null,
      isAdmin,
    } satisfies MiniAppCandidateSession;
  }
}
