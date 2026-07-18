import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { DEPTS, DEPT_SLUGS } from "@/lib/admin/constants";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
 const supabase = getSupabaseAdminClient() as any;

 const counts = await Promise.all(
 DEPT_SLUGS.map(async (slug) => {
 const { count } = await supabase
 .from("questions")
 .select("*", { count: "exact", head: true })
 .eq("department_id", DEPTS[slug].dbDeptId);
 return { slug, count: count ?? 0 };
 }),
 );

 const total = counts.reduce((s, c) => s + c.count, 0);

 const { data: recent } = await supabase
 .from("questions")
 .select("id, question_num, prompt_en, question_type, created_at, department_id")
 .order("created_at", { ascending: false })
 .limit(10);

 const deptMap: Record<string, string> = {};
 for (const slug of DEPT_SLUGS) deptMap[DEPTS[slug].dbDeptId] = DEPTS[slug].label;

 return (
 <DashboardClient
 total={total}
 counts={Object.fromEntries(counts.map((c) => [c.slug, c.count]))}
 recentQuestions={(recent ?? []).map((q: any) => ({
 id: q.id,
 num: q.question_num,
 prompt: q.prompt_en,
 type: q.question_type,
 dept: deptMap[q.department_id] ?? "—",
 createdAt: q.created_at,
 }))}
 />
 );
}
