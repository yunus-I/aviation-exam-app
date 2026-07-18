import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { QUESTION_IMAGES_BUCKET } from "@/lib/supabase/storage";
import type { ExamQuestion, ExamSet } from "@/features/exam/types";

export const runtime = "nodejs";

const DEPT_MAP: Record<string, string> = {
  amt: "AMT",
  pilot: "PILOT",
  cabin: "CABIN",
  marketing: "MKT",
  mgmt: "MKT",
  aero: "AMT",
  atc: "PILOT",
};

function getTopicSlug(subjectName: string): string {
  return subjectName.toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { dept?: string; subject?: string };
    const deptId = body.dept?.toLowerCase();
    const subjectName = body.subject;

    if (!deptId || !subjectName) {
      return NextResponse.json({ ok: false, error: "missing_parameters" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

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
    const questionsResult = (await supabase
      .from("questions")
      .select(`
        id,
        question_type,
        passage_text,
        prompt_en,
        explanation_en,
        question_media(storage_path, sort_order),
        question_options(id, option_key, option_text_en, is_correct, sort_order)
      `)
      .eq("department_id", deptResult.data.id)
      .eq("topic_id", topicResult.data.id)
      .eq("is_active", true)) as any;

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
