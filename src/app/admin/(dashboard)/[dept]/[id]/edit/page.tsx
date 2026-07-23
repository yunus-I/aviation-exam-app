import { notFound } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isValidDept, DEPTS, type DeptSlug } from "@/lib/admin/constants";
import { FlatQuestionForm } from "@/components/admin/flat-question-form";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ dept: string; id: string }> }

const QUESTION_IMAGES_BUCKET = "question-images";

export default async function EditDeptQuestionPage({ params }: Props) {
 const { dept: raw, id } = await params;
 if (!isValidDept(raw)) notFound();
 const dept = raw as DeptSlug;
 const deptInfo = DEPTS[dept];
 const supabase = getSupabaseAdminClient() as any;

 const [qResult, optsResult, topicsResult, mediaResult] = await Promise.all([
 supabase.from("questions").select("*").eq("id", id).eq("department_id", deptInfo.dbDeptId).maybeSingle(),
 supabase.from("question_options").select("option_key, option_text_en, is_correct").eq("question_id", id).order("sort_order"),
 supabase.from("topics").select("id, slug, name_en").order("name_en"),
 supabase.from("question_media").select("id, storage_path").eq("question_id", id).order("sort_order"),
 ]);

 const question = qResult.data as any;
 if (!question) notFound();

 const options = (optsResult.data as any[]) ?? [];
 const topics = ((topicsResult.data as { id: string; slug: string; name_en: string }[]) ?? [])
   .filter((t) => t.slug !== "aptitude" && t.slug !== "english");
 const mediaItems = (mediaResult.data as any[]) ?? [];

 const optMap: Record<string, string> = {};
 for (const o of options) optMap[o.option_key] = o.option_text_en;

 const images = mediaItems.map((m: any) => {
 const { data } = supabase.storage.from(QUESTION_IMAGES_BUCKET).getPublicUrl(m.storage_path);
 return { id: m.id, public_url: data.publicUrl };
 });

 const questionTopicId = (question as any).topic_id;
 const topicSlug = questionTopicId
 ? (topicsResult.data?.find((t: any) => t.id === questionTopicId) as any)?.slug ?? ""
 : "";

 return (
 <div className="space-y-6">
 <div>
 <h1 className="text-2xl font-bold text-[#1A202C] tracking-tight">Edit Question</h1>
 <p className="text-sm text-[#64748B] mt-1">{deptInfo.nameEn} · #{question.question_num ?? "—"}</p>
 </div>
 <FlatQuestionForm
 dept={dept}
 topics={topics}
 initialData={{
 id: question.id,
 question_num: question.question_num ?? 0,
 topicSlug: topicSlug || "",
 type: question.question_type,
 instruction_text: question.instruction_text ?? "",
 passage_text: question.passage_text ?? "",
 prompt: question.prompt_en,
 explanation: question.explanation_en ?? "",
 optA: optMap["A"] ?? "",
 optB: optMap["B"] ?? "",
 optC: optMap["C"] ?? "",
 optD: optMap["D"] ?? "",
 optE: optMap["E"] ?? "",
 correct: options.find((o: any) => o.is_correct)?.option_key ?? "",
 duration_minutes: question.duration_minutes ?? 2,
 images,
 }}
 />
 </div>
 );
}
