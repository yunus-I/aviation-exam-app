import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { UsersClient } from "./users-client";

export const dynamic = "force-dynamic";

function parseJoinedDepartment(row: Record<string, any>) {
  const dept = Array.isArray(row.departments) ? row.departments[0] : row.departments;
  if (!dept) return null;
  return {
    id: dept.id,
    slug: dept.slug,
    code: dept.code,
    name_en: dept.name_en,
    name_am: dept.name_am,
  };
}

export default async function AdminUsersPage() {
  const supabase = getSupabaseAdminClient() as any;

  // Fetch departments
  const { data: departments } = await supabase
    .from("departments")
    .select("id, slug, code, name_en, name_am")
    .eq("is_active", true)
    .order("name_en", { ascending: true });

  // Fetch initial candidates with total exact count
  const { data: candidates, count } = await supabase
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
    `,
      { count: "exact" }
    )
    .order("updated_at", { ascending: false })
    .range(0, 19);

  const formattedCandidates = (candidates || []).map((row: any) => ({
    ...row,
    departments: parseJoinedDepartment(row),
  }));

  const totalCount = count ?? formattedCandidates.length;

  return (
    <UsersClient
      initialCandidates={formattedCandidates}
      initialDepartments={departments || []}
      initialPagination={{
        page: 1,
        limit: 20,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / 20)),
      }}
    />
  );
}
