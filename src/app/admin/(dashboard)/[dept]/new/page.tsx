import { notFound } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDept, isValidDept, DEPTS, type DeptSlug } from "@/lib/admin/constants";
import { FlatQuestionForm } from "@/components/admin/flat-question-form";

interface Props {
  params: Promise<{ dept: string }>;
}

export default async function NewDeptQuestionPage({ params }: Props) {
  const { dept: raw } = await params;
  if (!isValidDept(raw)) notFound();
  const dept = raw as DeptSlug;
  const deptInfo = DEPTS[dept];
  const supabase = getSupabaseAdminClient() as any;

  const { data: _topics } = await supabase
    .from("topics")
    .select("id, slug, name_en")
    .eq("department_id", deptInfo.dbDeptId)
    .order("name_en");
  const topics = (_topics as { id: string; slug: string; name_en: string }[]) ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#003580] flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          New Question — {deptInfo.nameEn}
        </h1>
      </div>
      <FlatQuestionForm dept={dept} topics={topics} />
    </div>
  );
}
