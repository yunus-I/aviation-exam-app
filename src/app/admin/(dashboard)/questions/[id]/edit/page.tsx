import { notFound } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { QuestionForm } from "@/components/admin/question-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditQuestionPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = getSupabaseAdminClient();

  const [questionResult, optionsResult, banksResult, departmentsResult, topicsResult] =
    await Promise.all([
      supabase.from("questions").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("question_options")
        .select("option_key, option_text_en, option_text_am, is_correct")
        .eq("question_id", id)
        .order("sort_order"),
      supabase.from("question_banks").select("id, title_en").order("title_en"),
      supabase.from("departments").select("id, name_en").order("name_en"),
      supabase.from("topics").select("id, name_en").order("name_en"),
    ]);

  const question = questionResult.data as any;
  const options = optionsResult.data as any[] | null;
  const banks = (banksResult.data as any[]) ?? [];
  const departments = (departmentsResult.data as any[]) ?? [];
  const topics = (topicsResult.data as any[]) ?? [];

  if (!question) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#003580]">Edit Question</h1>
        <p className="text-sm text-[#64748B] mt-1">
          {question.prompt_en.slice(0, 80)}
          {question.prompt_en.length > 80 ? "…" : ""}
        </p>
      </div>

      <QuestionForm
        initialData={{
          id: question.id,
          question_bank_id: question.question_bank_id,
          department_id: question.department_id ?? "",
          topic_id: question.topic_id ?? "",
          question_type: question.question_type,
          prompt_en: question.prompt_en,
          prompt_am: question.prompt_am ?? "",
          explanation_en: question.explanation_en ?? "",
          explanation_am: question.explanation_am ?? "",
          source_label: question.source_label ?? "",
          source_year: question.source_year ? String(question.source_year) : "",
          is_active: question.is_active,
          options: (options ?? []).map((o: any) => ({
            option_key: o.option_key,
            option_text_en: o.option_text_en,
            option_text_am: o.option_text_am ?? "",
            is_correct: o.is_correct,
          })),
        }}
        banks={banks}
        departments={departments}
        topics={topics}
      />
    </div>
  );
}
