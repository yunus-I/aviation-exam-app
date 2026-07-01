import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/supabase/api-admin";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { options, ...questionData } = body;

    if (!questionData.prompt_en?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!questionData.question_bank_id) {
      return NextResponse.json({ error: "Question bank is required" }, { status: 400 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll() {},
        },
      },
    );

    const { data: question, error: questionError } = await supabase
      .from("questions")
      .insert({
        question_bank_id: questionData.question_bank_id,
        department_id: questionData.department_id || null,
        topic_id: questionData.topic_id || null,
        source_label: questionData.source_label || null,
        source_year: questionData.source_year ? parseInt(questionData.source_year, 10) : null,
        question_type: questionData.question_type || "single_choice",
        prompt_en: questionData.prompt_en.trim(),
        prompt_am: questionData.prompt_am?.trim() || null,
        explanation_en: questionData.explanation_en?.trim() || null,
        explanation_am: questionData.explanation_am?.trim() || null,
        is_active: questionData.is_active !== false,
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
            option_text_am: opt.option_text_am?.trim() || null,
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
