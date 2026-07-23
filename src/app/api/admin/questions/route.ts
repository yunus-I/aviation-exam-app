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
    const { options, topicSlug, department_id, passage_text, instruction_text, ...rest } = body;
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
          .maybeSingle();
      if (topic) topic_id = (topic as any).id;
    }

    let question_bank_id: string | null = null;
    const { data: existingBank } = await supabase
      .from("question_banks")
      .select("id")
      .eq("department_id", department_id)
      .maybeSingle();
    if (existingBank) {
      question_bank_id = existingBank.id;
    } else {
      const deptSlug = department_id.slice(0, 8);
      const { data: newBank } = await supabase
        .from("question_banks")
        .insert({
          slug: `admin-bank-${deptSlug}`,
          title_en: "Admin Questions",
          department_id,
          topic_id,
          is_active: true,
        })
        .select("id")
        .single();
      if (newBank) question_bank_id = newBank.id;
    }

    let insertPayload: Record<string, any> = {
      question_bank_id,
      department_id,
      topic_id,
      question_type: rest.type || "single_choice",
      instruction_text: instruction_text || null,
      passage_text: passage_text || null,
      prompt_en: prompt,
      explanation_en: explanation || null,
      question_num: rest.question_num ? parseInt(rest.question_num, 10) : null,
      duration_minutes: rest.duration_minutes ? parseInt(rest.duration_minutes, 10) : 2,
      is_active: true,
      created_by_admin_id: admin.id,
    };

    let { data: question, error: questionError } = await supabase
      .from("questions")
      .insert(insertPayload)
      .select("id")
      .single();

    if (questionError && (questionError.code === "42703" || questionError.message?.includes("instruction_text"))) {
      delete insertPayload.instruction_text;
      const res = await supabase
        .from("questions")
        .insert(insertPayload)
        .select("id")
        .single();
      question = res.data;
      questionError = res.error;
    }

    if (questionError && (questionError.code === "42703" || questionError.message?.includes("passage_text"))) {
      delete insertPayload.passage_text;
      const res = await supabase
        .from("questions")
        .insert(insertPayload)
        .select("id")
        .single();
      question = res.data;
      questionError = res.error;
    }

    if (questionError) {
      return NextResponse.json({ error: questionError.message }, { status: 500 });
    }

    // Do NOT auto-link questions to an exam set.
    // Questions should only be linked via explicit admin action or CSV import with topic mapping.

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
