import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { UsersClient } from "./users-client";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = getSupabaseAdminClient() as any;

  // Fetch departments
  const { data: departments } = await supabase
    .from("departments")
    .select("id, slug, code, name_en, name_am")
    .eq("is_active", true)
    .order("name_en", { ascending: true });

  // Fetch initial list of candidates (top 50)
  const { data: candidates } = await supabase
    .from("candidates")
    .select(
      `
      id,
      telegram_user_id,
      telegram_username,
      telegram_first_name,
      telegram_last_name,
      full_name,
      phone_number,
      current_registration_status,
      selected_department_id,
      created_at,
      updated_at,
      departments:selected_department_id(id, slug, code, name_en, name_am)
    `
    )
    .order("updated_at", { ascending: false })
    .limit(50);

  return (
    <UsersClient
      initialCandidates={candidates || []}
      initialDepartments={departments || []}
    />
  );
}
