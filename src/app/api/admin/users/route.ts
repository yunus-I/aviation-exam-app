import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/supabase/api-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const query = (searchParams.get("query") || "").trim();

    const supabase = getSupabaseAdminClient() as any;

    // Fetch active departments for selection
    const { data: departments, error: deptError } = await supabase
      .from("departments")
      .select("id, slug, code, name_en, name_am")
      .eq("is_active", true)
      .order("name_en", { ascending: true });

    if (deptError) {
      throw deptError;
    }

    // Build candidates query
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
      `
      );

    if (query) {
      const sanitized = query.replace(/[%_]/g, "\\$&");
      candidatesQuery = candidatesQuery.or(
        `full_name.ilike.%${sanitized}%,telegram_username.ilike.%${sanitized}%,telegram_first_name.ilike.%${sanitized}%,telegram_last_name.ilike.%${sanitized}%,phone_number.ilike.%${sanitized}%`
      );
    }

    const { data: candidates, error: candError } = await candidatesQuery
      .order("updated_at", { ascending: false })
      .limit(100);

    if (candError) {
      throw candError;
    }

    return NextResponse.json({
      candidates: candidates || [],
      departments: departments || [],
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

    const now = new Date().toISOString();

    // Update candidate's department
    const { error: updateCandidateError } = await supabase
      .from("candidates")
      .update({
        selected_department_id: departmentId,
        updated_at: now,
      })
      .eq("id", candidateId);

    if (updateCandidateError) {
      throw updateCandidateError;
    }

    // Also update any registration submissions for this candidate to keep them in sync
    await supabase
      .from("registration_submissions")
      .update({
        department_id: departmentId,
        updated_at: now,
      })
      .eq("candidate_id", candidateId);

    // Fetch updated candidate record
    const { data: updatedCandidate, error: fetchUpdatedError } = await supabase
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
      .eq("id", candidateId)
      .single();

    if (fetchUpdatedError) {
      throw fetchUpdatedError;
    }

    return NextResponse.json({
      success: true,
      candidate: updatedCandidate,
    });
  } catch (error: any) {
    console.error("[API Admin Users PATCH Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update department" },
      { status: 500 }
    );
  }
}
