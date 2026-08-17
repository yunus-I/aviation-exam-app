import { notFound } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isValidDept, DEPTS, type DeptSlug } from "@/lib/admin/constants";
import { FlatQuestionForm } from "@/components/admin/flat-question-form";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ dept: string }> }

export default async function NewDeptQuestionPage({ params }: Props) {
 const { dept: raw } = await params;
 if (!isValidDept(raw)) notFound();
 const dept = raw as DeptSlug;
 const deptInfo = DEPTS[dept];
 const supabase = getSupabaseAdminClient() as any;

 const { data: _topics } = await supabase
 .from("topics")
 .select("id, slug, name_en")
 .order("name_en");
 const topics = ((_topics as { id: string; slug: string; name_en: string }[]) ?? [])
   .filter((t) => t.slug !== "aptitude" && t.slug !== "english");

  if (!topics.some((t) => t.slug === "model-exam-1" || t.name_en?.toLowerCase() === "model exam 1")) {
    topics.push({ id: "model-exam-1", slug: "model-exam-1", name_en: "Model Exam 1" });
  }

 return (
 <div className="space-y-6">
 <div>
 <h1 className="text-2xl font-bold text-[#1A202C] tracking-tight">New Question</h1>
 <p className="text-sm text-[#64748B] mt-1">{deptInfo.nameEn}</p>
 </div>
 <FlatQuestionForm dept={dept} topics={topics} />
 </div>
 );
}
