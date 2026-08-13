import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/supabase/api-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

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

export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const query = (searchParams.get("query") || "").trim();
    const departmentFilter = (searchParams.get("departmentId") || "").trim();
    const statusFilter = (searchParams.get("status") || "").trim();
    
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const fromIndex = (page - 1) * limit;
    const toIndex = fromIndex + limit - 1;

    const supabase = getSupabaseAdminClient() as any;

    // Fetch active departments for select dropdowns
    const { data: departments, error: deptError } = await supabase
      .from("departments")
      .select("id, slug, code, name_en, name_am")
      .eq("is_active", true)
      .order("name_en", { ascending: true });

    if (deptError) {
      throw deptError;
    }

    // Build query with exact count
    let candidatesQuery = supabase
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
      );

    if (query) {
      const sanitized = query.replace(/[%_]/g, "\\$&");
      candidatesQuery = candidatesQuery.or(
        `full_name.ilike.%${sanitized}%,telegram_username.ilike.%${sanitized}%,telegram_first_name.ilike.%${sanitized}%,telegram_last_name.ilike.%${sanitized}%,phone_number.ilike.%${sanitized}%`
      );
    }

    if (departmentFilter && departmentFilter !== "all") {
      candidatesQuery = candidatesQuery.eq("selected_department_id", departmentFilter);
    }

    if (statusFilter && statusFilter !== "all") {
      candidatesQuery = candidatesQuery.eq("current_registration_status", statusFilter);
    }

    const { data: rawCandidates, count, error: candError } = await candidatesQuery
      .order("updated_at", { ascending: false })
      .range(fromIndex, toIndex);

    if (candError) {
      throw candError;
    }

    const formattedCandidates = (rawCandidates || []).map((row: any) => ({
      ...row,
      departments: parseJoinedDepartment(row),
    }));

    const totalCount = count ?? formattedCandidates.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    return NextResponse.json({
      candidates: formattedCandidates,
      departments: departments || [],
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error("[API Admin Users GET Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { candidateId, departmentId } = body;

    if (!candidateId || typeof candidateId !== "string") {
      return NextResponse.json(
        { error: "candidateId is required" },
        { status: 400 }
      );
    }

    if (!departmentId || typeof departmentId !== "string") {
      return NextResponse.json(
        { error: "departmentId is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient() as any;

    // Verify department exists
    const { data: targetDept, error: targetDeptError } = await supabase
      .from("departments")
      .select("id, name_en, code")
      .eq("id", departmentId)
      .maybeSingle();

    if (targetDeptError || !targetDept) {
      return NextResponse.json(
        { error: "Target department does not exist" },
        { status: 400 }
      );
    }

    // First find candidate by UUID or Telegram User ID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidateId);
    let findQuery = supabase.from("candidates").select("id, telegram_user_id");
    if (isUuid) {
      findQuery = findQuery.eq("id", candidateId);
    } else {
      findQuery = findQuery.eq("telegram_user_id", Number(candidateId));
    }

    const { data: candidateRow, error: findError } = await findQuery.maybeSingle();

    if (findError || !candidateRow) {
      return NextResponse.json(
        { error: "Candidate record not found" },
        { status: 404 }
      );
    }

    const actualCandidateId = candidateRow.id;
    const telegramUserId = candidateRow.telegram_user_id;
    const now = new Date().toISOString();

    // 1. Update candidate's department
    const { error: updateCandidateError } = await supabase
      .from("candidates")
      .update({
        selected_department_id: departmentId,
        updated_at: now,
      })
      .eq("id", actualCandidateId);

    if (updateCandidateError) {
      throw updateCandidateError;
    }

    // 2. Update registration_submissions table
    await supabase
      .from("registration_submissions")
      .update({
        department_id: departmentId,
        updated_at: now,
      })
      .or(`candidate_id.eq.${actualCandidateId},telegram_user_id.eq.${telegramUserId}`);

    // 3. Update registration_drafts table
    await supabase
      .from("registration_drafts")
      .update({
        department_id: departmentId,
        updated_at: now,
      })
      .eq("candidate_id", actualCandidateId);

    // Fetch updated candidate record
    const { data: updatedCandidateRaw, error: fetchUpdatedError } = await supabase
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
      .eq("id", actualCandidateId)
      .single();

    if (fetchUpdatedError) {
      throw fetchUpdatedError;
    }

    const formattedCandidate = {
      ...updatedCandidateRaw,
      departments: parseJoinedDepartment(updatedCandidateRaw),
    };

    return NextResponse.json({
      success: true,
      candidate: formattedCandidate,
    });
  } catch (error: any) {
    console.error("[API Admin Users PATCH Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update department" },
      { status: 500 }
    );
  }
}
