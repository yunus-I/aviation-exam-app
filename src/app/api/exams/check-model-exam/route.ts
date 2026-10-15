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

export interface ModelExamItemResponse {
  examNumber: number;
  id: string;
  label: string;
  examSetId: string;
  questionCount: number;
  durationMinutes: number;
  hasQuestions: boolean;
}

export interface CheckModelExamResponse {
  ok: boolean;
  hasModelExam: boolean;
  questionCount: number;
  modelExams: ModelExamItemResponse[];
  error?: string;
}

const modelExamCache = new Map<string, { data: CheckModelExamResponse; timestamp: number }>();
const CACHE_TTL_MS = 15 * 1000; // 15 seconds

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
          "Cache-Control": "public, max-age=15, stale-while-revalidate=60",
        },
      });
    }

    const supabase = getSupabaseAdminClient() as any;

    // 1. Resolve Department
    const dbDeptCode = DEPT_MAP[deptId] ?? deptId.toUpperCase();
    let deptResult = await supabase
      .from("departments")
      .select("id, code, slug")
      .eq("code", dbDeptCode)
      .maybeSingle();

    if (!deptResult.data) {
      deptResult = await supabase
        .from("departments")
        .select("id, code, slug")
        .or(`slug.eq.${deptId},slug.eq.${deptId}-crew`)
        .maybeSingle();
    }

    if (deptResult.error || !deptResult.data) {
      const resp: CheckModelExamResponse = { ok: true, hasModelExam: false, questionCount: 0, modelExams: [] };
      modelExamCache.set(deptId, { data: resp, timestamp: Date.now() });
      return NextResponse.json(resp, {
        headers: { "Cache-Control": "public, max-age=15, stale-while-revalidate=60" },
      });
    }

    const departmentId = deptResult.data.id;

    // 2. Query topics for Model Exam 1 and Model Exam 2
    const { data: topicsData } = await supabase
      .from("topics")
      .select("id, slug, name_en")
      .or("slug.eq.model-exam-1,slug.eq.model exam 1,name_en.ilike.Model Exam 1,slug.eq.model-exam-2,slug.eq.model exam 2,name_en.ilike.Model Exam 2");

    const topics = (topicsData as Array<{ id: string; slug: string; name_en: string }> | null) ?? [];

    const topic1Ids = topics
      .filter((t) => t.slug === "model-exam-1" || t.slug === "model exam 1" || t.name_en?.toLowerCase() === "model exam 1")
      .map((t) => t.id);

    const topic2Ids = topics
      .filter((t) => t.slug === "model-exam-2" || t.slug === "model exam 2" || t.name_en?.toLowerCase() === "model exam 2")
      .map((t) => t.id);

    // 3. Count questions for each model exam topic
    let count1 = 0;
    if (topic1Ids.length > 0) {
      const { count } = await supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("department_id", departmentId)
        .eq("is_active", true)
        .in("topic_id", topic1Ids);
      count1 = count ?? 0;
    }

    let count2 = 0;
    if (topic2Ids.length > 0) {
      const { count } = await supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("department_id", departmentId)
        .eq("is_active", true)
        .in("topic_id", topic2Ids);
      count2 = count ?? 0;
    }

    const modelExams: ModelExamItemResponse[] = [];
    const isAmt = deptId === "amt" || dbDeptCode === "AMT";
    const isCabin = deptId === "cabin" || dbDeptCode === "CABIN";

    // Model Exam 1 is configured for AMT and Cabin, or any dept with questions
    if (isAmt || isCabin || count1 > 0) {
      modelExams.push({
        examNumber: 1,
        id: `${deptId}-model-exam-1`,
        label: "Model Exam 1",
        examSetId: `${deptId}-model-exam-1`,
        questionCount: count1 > 0 ? count1 : 60,
        durationMinutes: 90,
        hasQuestions: count1 > 0,
      });
    }

    // Model Exam 2 is configured for AMT, or any dept with questions
    if (isAmt || count2 > 0) {
      modelExams.push({
        examNumber: 2,
        id: `${deptId}-model-exam-2`,
        label: "Model Exam 2",
        examSetId: `${deptId}-model-exam-2`,
        questionCount: count2 > 0 ? count2 : 60,
        durationMinutes: 90,
        hasQuestions: count2 > 0,
      });
    }

    const hasAnyModelExam = modelExams.length > 0;
    const primaryCount = count1 > 0 ? count1 : (count2 > 0 ? count2 : 60);

    const resp: CheckModelExamResponse = {
      ok: true,
      hasModelExam: hasAnyModelExam,
      questionCount: primaryCount,
      modelExams,
    };

    modelExamCache.set(deptId, { data: resp, timestamp: Date.now() });

    return NextResponse.json(resp, {
      headers: {
        "Cache-Control": "public, max-age=15, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("Check model exam endpoint error:", err);
    return NextResponse.json({ ok: false, error: "internal_server_error" }, { status: 500 });
  }
}
