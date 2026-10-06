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

const candidateSessionCache = new Map<number, { session: MiniAppCandidateSession | null; timestamp: number }>();
const SESSION_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export class AuthRepository {
  private readonly supabase = getSupabaseAdminClient();

  async getCandidateSessionByTelegramUserId(telegramUserId: number) {
    const cached = candidateSessionCache.get(telegramUserId);
    if (cached && Date.now() - cached.timestamp < SESSION_CACHE_TTL_MS) {
      return cached.session;
    }
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
        selected_region_id,
        approved_at,
        rejected_at
      `
      )
      .eq("telegram_user_id", telegramUserId)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      if (isAdmin) {
        const adminSession = {
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
        candidateSessionCache.set(telegramUserId, { session: adminSession, timestamp: Date.now() });
        return adminSession;
      }
      return null;
    }

    const row = result.data as Record<string, any>;

    let departmentName: string | null = null;
    let departmentId: string | null = (row.selected_department_id as string | null) ?? null;

    if (departmentId) {
      const deptRes = await this.supabase
        .from("departments")
        .select("name_en")
        .eq("id", departmentId)
        .maybeSingle();
      if (deptRes.data?.name_en) {
        departmentName = deptRes.data.name_en;
      }
    }

    if (!departmentName && isAdmin) {
      departmentName = "All Departments";
      departmentId = "all";
    }

    let regionName: string | null = null;
    if (row.selected_region_id) {
      const regionRes = await this.supabase
        .from("regions")
        .select("name_en")
        .eq("id", row.selected_region_id)
        .maybeSingle();
      if (regionRes.data?.name_en) {
        regionName = regionRes.data.name_en;
      }
    }

    const finalSession = {
      candidateId: row.id as string,
      telegramUserId: Number(row.telegram_user_id),
      fullName: (row.full_name as string | null) ?? (isAdmin ? "Admin" : null),
      preferredLanguage: (row.preferred_language as AppLanguage) || "en",
      registrationStatus: isAdmin ? "approved" : (row.current_registration_status as RegistrationStatus),
      departmentId,
      departmentName,
      regionName,
      approvedAt: (row.approved_at as string | null) ?? null,
      rejectedAt: (row.rejected_at as string | null) ?? null,
      isAdmin,
    } satisfies MiniAppCandidateSession;

    candidateSessionCache.set(telegramUserId, { session: finalSession, timestamp: Date.now() });
    return finalSession;
  }
}
