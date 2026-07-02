import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDept, isValidDept, DEPTS, type DeptSlug } from "@/lib/admin/constants";

interface Props {
  params: Promise<{ dept: string }>;
  searchParams: Promise<{ page?: string; search?: string }>;
}

const PAGE_SIZE = 50;

const typeLabel: Record<string, string> = {
  single_choice: "SC",
  multiple_choice: "MC",
  true_false: "TF",
};

export default async function DeptQuestionsPage({ params, searchParams }: Props) {
  const { dept: raw } = await params;
  const sp = await searchParams;

  if (!isValidDept(raw)) notFound();
  const dept = raw as DeptSlug;
  const deptInfo = DEPTS[dept];
  const supabase = getSupabaseAdminClient() as any;

  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const search = sp.search?.trim() || "";
  const offset = (page - 1) * PAGE_SIZE;

  const [topicsRes] = await Promise.all([
    supabase.from("topics").select("id, slug, name_en").eq("department_id", deptInfo.dbDeptId).order("name_en"),
  ]);

  let qb = supabase
    .from("questions")
    .select(`id, question_num, question_type, prompt_en, topic:topics(slug, name_en)`, { count: "exact" })
    .eq("department_id", deptInfo.dbDeptId);

  if (search) {
    qb = qb.or(`prompt_en.ilike.%${search}%`);
  }

  const { data: questionsData, count: total } = await qb
    .order("question_num", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const questions = (questionsData as any[]) ?? [];
  const topics = (topicsRes.data as any[]) ?? [];
  const totalPages = Math.ceil((total ?? 0) / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#003580]">{deptInfo.nameEn}</h1>
          <p className="text-sm text-[#64748B] mt-1">{total} question{total !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href={`/admin/${dept}/new`}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#003580] hover:bg-[#00276B] active:bg-[#001F52] transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          New Question
        </Link>
      </div>

      <form className="bg-white border border-[#E4E8F0] rounded-xl p-4 mb-6 flex flex-wrap gap-3 shadow-sm">
        <div className="flex-1 min-w-[200px] relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/></svg>
          <input name="search" defaultValue={search} placeholder="Search prompt…" className="w-full pl-9 pr-3.5 py-2.5 border border-[#E4E8F0] rounded-lg text-sm focus:border-[#003580] focus:ring-3 focus:ring-[#003580]/10 outline-none transition" />
        </div>
        <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#003580] hover:bg-[#00276B] active:bg-[#001F52] transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/></svg>
          Search
        </button>
        <Link href={`/admin/${dept}`} className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold text-[#64748B] hover:text-[#1A202C] border border-[#E4E8F0] hover:bg-[#F7F8FC] transition">Clear</Link>
      </form>

      <div className="bg-white border border-[#E4E8F0] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F1F4F9] border-b border-[#E4E8F0]">
              <th className="text-left px-4 py-3 text-xs font-semibold tracking-wider uppercase text-[#64748B] w-16">#</th>
              <th className="text-left px-4 py-3 text-xs font-semibold tracking-wider uppercase text-[#64748B]">Topic</th>
              <th className="text-left px-4 py-3 text-xs font-semibold tracking-wider uppercase text-[#64748B] w-16">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold tracking-wider uppercase text-[#64748B]">Prompt</th>
              <th className="text-right px-4 py-3 text-xs font-semibold tracking-wider uppercase text-[#64748B] w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <div className="text-[#94A3B8]">
                    <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                    <p className="text-sm font-medium">No questions yet</p>
                    <p className="text-xs mt-1">Create your first question for {deptInfo.nameEn}</p>
                  </div>
                </td>
              </tr>
            )}
            {questions.map((q: any, i: number) => (
              <tr key={q.id} className={`border-b border-[#E4E8F0] last:border-b-0 hover:bg-[#F7F8FC] transition ${i % 2 === 0 ? "bg-white" : "bg-[#FAFBFC]"}`}>
                <td className="px-4 py-3 text-[#64748B] font-mono text-xs">{q.question_num ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-[#64748B]">{(q.topic as any)?.name_en ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700">{typeLabel[q.question_type] || q.question_type}</span>
                </td>
                <td className="px-4 py-3 max-w-md">
                  <div className="truncate font-medium text-[#1A202C]">{q.prompt_en}</div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/${dept}/${q.id}/edit`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#003580] hover:bg-[#003580]/5 transition">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 && (
            <Link href={`/admin/${dept}?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`} className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:text-[#003580] border border-[#E4E8F0] transition">Previous</Link>
          )}
          <span className="text-sm text-[#64748B] px-3">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={`/admin/${dept}?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`} className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:text-[#003580] border border-[#E4E8F0] transition">Next</Link>
          )}
        </div>
      )}
    </div>
  );
}
