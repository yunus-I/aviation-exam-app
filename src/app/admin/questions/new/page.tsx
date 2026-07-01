import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { QuestionForm } from "@/components/admin/question-form";

export default async function NewQuestionPage() {
  const supabase = getSupabaseAdminClient();

  const [banksRes, departmentsRes, topicsRes] = await Promise.all([
    supabase.from("question_banks").select("id, title_en").order("title_en"),
    supabase.from("departments").select("id, name_en").order("name_en"),
    supabase.from("topics").select("id, name_en").order("name_en"),
  ]);

  const banks = (banksRes.data as any[]) ?? [];
  const departments = (departmentsRes.data as any[]) ?? [];
  const topics = (topicsRes.data as any[]) ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#003580]">New Question</h1>
        <p className="text-sm text-[#64748B] mt-1">Create a new exam question</p>
      </div>

      <QuestionForm
        banks={banks}
        departments={departments}
        topics={topics}
      />
    </div>
  );
}
