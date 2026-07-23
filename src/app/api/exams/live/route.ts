import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { QUESTION_IMAGES_BUCKET } from "@/lib/supabase/storage";
import type { ExamQuestion, ExamSet } from "@/features/exam/types";

import { ExamContentRepository } from "@/features/exam/repository";

export const runtime = "nodejs";

const DEPT_MAP: Record<string, string> = {
  amt: "AMT",
  pilot: "PILOT",
  cabin: "CABIN",
  marketing: "MKT",
  mgmt: "MKT",
  aero: "AMT",
  atc: "PILOT",
  others: "OTHERS",
};

function getTopicSlug(subjectName: string): string {
  return subjectName.toLowerCase();
}

function normalizeLookupKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function resolveImportedExamSetKey(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  departmentId: string,
  subjectName: string,
  requestedKey?: string,
) {
  const candidates = new Set<string>();
  if (requestedKey) {
    candidates.add(normalizeLookupKey(requestedKey));
  }

  const normalizedSubject = normalizeLookupKey(subjectName);
  if (normalizedSubject) {
    candidates.add(normalizedSubject);
  }

  const examSetResult = await supabase
    .from("exam_sets")
    .select("import_key, slug, title_en")
    .eq("department_id", departmentId)
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false });

  if (examSetResult.error) {
    throw examSetResult.error;
  }

  const rows = (examSetResult.data ?? []) as Array<{
    import_key?: string;
    slug?: string;
    title_en?: string;
  }>;

  return rows.find((row) => {
    const haystacks = [row.import_key, row.slug, row.title_en].filter(Boolean) as string[];
    return haystacks.some((value) => {
      const normalizedValue = normalizeLookupKey(value);
      return candidates.has(normalizedValue) || normalizedValue.includes(normalizedSubject);
    });
  })?.import_key ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { dept?: string; subject?: string; examSetId?: string };
    const deptId = body.dept?.toLowerCase();
    const subjectName = body.subject;
    const examSetId = body.examSetId;

    if (!deptId || !subjectName) {
      return NextResponse.json({ ok: false, error: "missing_parameters" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const repo = new ExamContentRepository();

    if (examSetId) {
      try {
        const examSet = await repo.getExamSetByImportKey(examSetId);
        return NextResponse.json({ ok: true, examSet });
      } catch (error) {
        console.error("Failed to load via importKey, falling back to legacy fetch:", error);
      }
    }

    // 1. Get Department
    const dbDeptCode = DEPT_MAP[deptId] ?? deptId.toUpperCase();
    const deptResult = (await supabase
      .from("departments")
      .select("id, name_en")
      .eq("code", dbDeptCode)
      .single()) as any;

    if (deptResult.error) {
      return NextResponse.json({ ok: false, error: "department_not_found" });
    }

    const resolvedExamSetKey = await resolveImportedExamSetKey(
      supabase,
      deptResult.data.id,
      subjectName,
      examSetId,
    );

    if (resolvedExamSetKey) {
      try {
        const examSet = await repo.getExamSetByImportKey(resolvedExamSetKey);
        return NextResponse.json({ ok: true, examSet });
      } catch (error) {
        console.error("Failed to resolve imported exam set:", error);
      }
    }

    // 2. Get Topic
    const dbTopicSlug = getTopicSlug(subjectName);
    const topicResult = (await supabase
      .from("topics")
      .select("id, name_en")
      .eq("slug", dbTopicSlug)
      .single()) as any;

    if (topicResult.error) {
      return NextResponse.json({ ok: false, error: "topic_not_found" });
    }

    // 3. Get Questions with options and media
    let questionsResult = (await supabase
      .from("questions")
      .select(`
        id,
        question_num,
        question_type,
        instruction_text,
        passage_text,
        prompt_en,
        explanation_en,
        question_media(storage_path, sort_order),
        question_options(id, option_key, option_text_en, is_correct, sort_order)
      `)
      .eq("department_id", deptResult.data.id)
      .eq("topic_id", topicResult.data.id)
      .eq("is_active", true)
      .order("question_num", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })) as any;

    if (questionsResult.error && (questionsResult.error.code === "42703" || questionsResult.error.message?.includes("instruction_text"))) {
      questionsResult = (await supabase
        .from("questions")
        .select(`
          id,
          question_num,
          question_type,
          passage_text,
          prompt_en,
          explanation_en,
          question_media(storage_path, sort_order),
          question_options(id, option_key, option_text_en, is_correct, sort_order)
        `)
        .eq("department_id", deptResult.data.id)
        .eq("topic_id", topicResult.data.id)
        .eq("is_active", true)
        .order("question_num", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true })) as any;
    }

    if (questionsResult.error && (questionsResult.error.code === "42703" || questionsResult.error.message?.includes("passage_text"))) {
      questionsResult = (await supabase
        .from("questions")
        .select(`
          id,
          question_num,
          question_type,
          prompt_en,
          explanation_en,
          question_media(storage_path, sort_order),
          question_options(id, option_key, option_text_en, is_correct, sort_order)
        `)
        .eq("department_id", deptResult.data.id)
        .eq("topic_id", topicResult.data.id)
        .eq("is_active", true)
        .order("question_num", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true })) as any;
    }

    if (questionsResult.error || !questionsResult.data || questionsResult.data.length === 0) {
      return NextResponse.json({ ok: false, error: "no_questions_found" });
    }

    const questions: ExamQuestion[] = [];

    for (const q of (questionsResult.data as any[])) {
      let imageUrl: string | undefined;
      const mediaRow = (q.question_media as any)?.[0];

      if (mediaRow?.storage_path) {
        if (String(mediaRow.storage_path).startsWith("http")) {
          imageUrl = mediaRow.storage_path;
        } else {
          const { data } = supabase.storage
            .from(QUESTION_IMAGES_BUCKET)
            .getPublicUrl(String(mediaRow.storage_path));

          imageUrl = data.publicUrl;
        }
      }

      questions.push({
        id: q.id,
        type: q.question_type as any,
        topic: topicResult.data.name_en,
        instruction: q.instruction_text || undefined,
        passage: q.passage_text || undefined,
        prompt: q.prompt_en,
        explanation: q.explanation_en ?? "No explanation yet.",
        imageUrl,
        options: ((q.question_options as any[]) ?? [])
          .sort((left, right) => Number(left.sort_order) - Number(right.sort_order))
          .map((option) => ({
            id: option.id,
            label: option.option_key,
            text: option.option_text_en,
            isCorrect: Boolean(option.is_correct),
          })),
      });
    }

    // Build Mock / Practice ExamSet wrapper
    const examSet: ExamSet = {
      id: `${deptId}-${dbTopicSlug}-live`,
      title: `${deptResult.data.name_en} — ${topicResult.data.name_en} Practice`,
      subject: topicResult.data.name_en,
      department: deptResult.data.name_en,
      durationMinutes: 45, // default duration
      modeLabel: "Live Supabase Database",
      instructions: [
        "This exam was loaded from the live PostgreSQL database.",
        "Your timing and question navigation behave like the production exam flow.",
        "Image questions are delivered from secure storage when available.",
      ],
      questions,
    };

    return NextResponse.json({
      ok: true,
      examSet,
    });
  } catch (error) {
    console.error("Fetch live exam error:", error);
    return NextResponse.json({ ok: false, error: "internal_server_error" }, { status: 500 });
  }
}
