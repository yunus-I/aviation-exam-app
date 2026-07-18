import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/supabase/api-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { options, topicSlug, department_id, passage_text, ...rest } = body;
    const prompt = (rest.prompt || "").trim();
    const explanation = (rest.explanation || "").trim();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient() as any;

    let topic_id: string | null = null;
    if (topicSlug) {
      const { data: topic } = await supabase
        .from("topics")
          .select("id")
          .eq("slug", topicSlug)
          .maybeSingle() as any;
      if (topic) topic_id = (topic as any).id;
    }

    const { error: questionError } = await supabase
      .from("questions")
      .update({
        topic_id,
        question_type: rest.type || "single_choice",
        passage_text: passage_text || null,
        prompt_en: prompt,
        explanation_en: explanation || null,
        question_num: rest.question_num ? parseInt(rest.question_num, 10) : null,
        duration_minutes: rest.duration_minutes ? parseInt(rest.duration_minutes, 10) : 2,
      })
      .eq("id", id);

    if (questionError) {
      return NextResponse.json({ error: questionError.message }, { status: 500 });
    }

    if (options) {
      await supabase.from("question_options").delete().eq("question_id", id);

      if (options.length > 0) {
        const { error: optionsError } = await supabase
          .from("question_options")
          .insert(
            options.map((opt: any, i: number) => ({
              question_id: id,
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
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseAdminClient() as any;
  const { error } = await supabase.from("questions").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
