import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const DEPT_MAP: Record<string, string> = {
  amt: "AMT",
  "amt-maintenance": "AMT",
  pilot: "PILOT",
  cabin: "CABIN",
  "cabin-crew": "CABIN",
  "cabin crew": "CABIN",
  marketing: "MKT",
  mkt: "MKT",
  mgmt: "MKT",
  aero: "AMT",
  atc: "PILOT",
  others: "OTHERS",
};

const modelExamCache = new Map<string, { data: { ok: boolean; hasModelExam: boolean; questionCount: number }; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deptId = searchParams.get("dept")?.toLowerCase();

    if (!deptId) {
      return NextResponse.json({ ok: false, error: "missing_dept" }, { status: 400 });
    }

    const cached = modelExamCache.get(deptId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
        },
      });
    }

    const supabase = getSupabaseAdminClient() as any;

    // 1. Resolve Department
    const dbDeptCode = DEPT_MAP[deptId] ?? deptId.toUpperCase();
    let deptResult = await supabase
      .from("departments")
      .select("id")
      .eq("code", dbDeptCode)
      .maybeSingle();

    if (!deptResult.data) {
      deptResult = await supabase
        .from("departments")
        .select("id")
        .or(`slug.eq.${deptId},slug.eq.${deptId}-crew`)
        .maybeSingle();
    }

    if (deptResult.error || !deptResult.data) {
      const resp = { ok: true, hasModelExam: false, questionCount: 0 };
      modelExamCache.set(deptId, { data: resp, timestamp: Date.now() });
      return NextResponse.json(resp, {
        headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=86400" },
      });
    }

    // 2. Resolve Topic for Model Exam 1
    const topicsResult = await supabase
      .from("topics")
      .select("id")
      .or("slug.eq.model-exam-1,slug.eq.model exam 1,name_en.ilike.Model Exam 1");

    const topicIds = (topicsResult.data ?? []).map((t: any) => t.id);

    if (topicIds.length === 0) {
      const resp = { ok: true, hasModelExam: false, questionCount: 0 };
      modelExamCache.set(deptId, { data: resp, timestamp: Date.now() });
      return NextResponse.json(resp, {
        headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=86400" },
      });
    }

    // 3. Count active questions matching department and topic
    const { count, error } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("department_id", deptResult.data.id)
      .eq("is_active", true)
      .in("topic_id", topicIds);

    if (error) {
      console.error("Error checking model exam questions count:", error);
      return NextResponse.json({ ok: true, hasModelExam: false, questionCount: 0 });
    }

    const questionCount = count ?? 0;
    const resp = {
      ok: true,
      hasModelExam: questionCount > 0,
      questionCount,
    };

    modelExamCache.set(deptId, { data: resp, timestamp: Date.now() });

    return NextResponse.json(resp, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("Check model exam endpoint error:", err);
    return NextResponse.json({ ok: false, error: "internal_server_error" }, { status: 500 });
  }
}
