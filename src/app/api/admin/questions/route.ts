import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/supabase/api-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { options, topicSlug, department_id, ...rest } = body;
    const prompt = (rest.prompt || "").trim();
    const explanation = (rest.explanation || "").trim();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!department_id) {
      return NextResponse.json({ error: "Department is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient() as any;

    // Resolve topicSlug to topic_id
    let topic_id: string | null = null;
    if (topicSlug) {
      const { data: topic } = await (
        supabase as any
      )
        .from("topics")
        .select("id")
        .eq("slug", topicSlug)
        .eq("department_id", department_id)
        .maybeSingle();
      if (topic) topic_id = (topic as any).id;
    }

    const { data: question, error: questionError } = await supabase
      .from("questions")
      .insert({
        department_id,
        topic_id,
        question_type: rest.type || "single_choice",
        prompt_en: prompt,
        explanation_en: explanation || null,
        question_num: rest.question_num ? parseInt(rest.question_num, 10) : null,
        duration_minutes: rest.duration_minutes ? parseInt(rest.duration_minutes, 10) : 2,
        is_active: true,
        created_by_admin_id: admin.id,
      })
      .select("id")
      .single();

    if (questionError) {
      return NextResponse.json({ error: questionError.message }, { status: 500 });
    }

    if (options?.length > 0) {
      const { error: optionsError } = await supabase
        .from("question_options")
        .insert(
          options.map((opt: any, i: number) => ({
            question_id: question.id,
            option_key: opt.option_key || String.fromCharCode(65 + i),
            option_text_en: opt.option_text_en.trim(),
            is_correct: !!opt.is_correct,
            sort_order: i + 1,
          })),
        );

      if (optionsError) {
        return NextResponse.json({ error: optionsError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, id: question.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
