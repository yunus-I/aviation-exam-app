import Link from "next/link";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    department_id?: string;
    topic_id?: string;
    question_type?: string;
    is_active?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 20;

function buildQuery(params: Record<string, string>, overrides: Record<string, string>) {
  const merged = { ...params, ...overrides };
  const filtered = Object.fromEntries(
    Object.entries(merged).filter(([, v]) => v !== ""),
  );
  return new URLSearchParams(filtered).toString();
}

const QUESTION_TYPES = [
  { value: "single_choice", label: "Single Choice" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false", label: "True / False" },
] as const;

export default async function AdminQuestionsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const supabase = getSupabaseAdminClient();

  const search = sp.search?.trim() || "";
  const departmentId = sp.department_id || "";
  const topicId = sp.topic_id || "";
  const questionType = sp.question_type || "";
  const isActive = sp.is_active || "";
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);

  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("questions")
    .select("*, department:departments(*), topic:topics(*), question_bank:question_banks(*)",
      { count: "exact" },
    );

  if (search) {
    query = query.or(
      `prompt_en.ilike.%${search}%,prompt_am.ilike.%${search}%,source_label.ilike.%${search}%`,
    );
  }

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }

  if (topicId) {
    query = query.eq("topic_id", topicId);
  }

  if (questionType) {
    query = query.eq("question_type", questionType);
  }

  if (isActive === "true") {
    query = query.eq("is_active", true);
  } else if (isActive === "false") {
    query = query.eq("is_active", false);
  }

  const { data: rawQuestions, count: total } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const departmentsRes = await supabase
    .from("departments")
    .select("id, name_en")
    .order("name_en");

  const topicsRes = await supabase
    .from("topics")
    .select("id, name_en")
    .order("name_en");

  const questions = (rawQuestions as any[]) ?? [];
  const departments = (departmentsRes.data as any[]) ?? [];
  const topics = (topicsRes.data as any[]) ?? [];

  const totalPages = Math.ceil((total ?? 0) / PAGE_SIZE);

  const typeBadge: Record<string, string> = {
    single_choice: "bg-blue-50 text-blue-700",
    multiple_choice: "bg-purple-50 text-purple-700",
    true_false: "bg-amber-50 text-amber-700",
  };

  const typeLabel: Record<string, string> = {
    single_choice: "SC",
    multiple_choice: "MC",
    true_false: "TF",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#003580] flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Questions
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            {total ?? 0} question{(total ?? 0) !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/admin/questions/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#003580] hover:bg-[#00276B] active:bg-[#001F52] transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          New Question
        </Link>
      </div>

      <form className="bg-white border border-[#E4E8F0] rounded-xl p-4 mb-6 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/></svg>
          <input
            name="search"
            defaultValue={search}
            placeholder="Search by prompt or source..."
            className="w-full pl-9 pr-3.5 py-2 border border-[#E4E8F0] rounded-lg text-sm focus:border-[#003580] focus:ring-3 focus:ring-[#003580]/10 outline-none transition"
          />
        </div>

        <select
          name="department_id"
          defaultValue={departmentId}
          className="px-3.5 py-2 border border-[#E4E8F0] rounded-lg text-sm bg-white focus:border-[#003580] focus:ring-3 focus:ring-[#003580]/10 outline-none transition"
        >
          <option value="">All Departments</option>
          {departments?.map((d) => (
            <option key={d.id} value={d.id}>{d.name_en}</option>
          ))}
        </select>

        <select
          name="topic_id"
          defaultValue={topicId}
          className="px-3.5 py-2 border border-[#E4E8F0] rounded-lg text-sm bg-white focus:border-[#003580] focus:ring-3 focus:ring-[#003580]/10 outline-none transition"
        >
          <option value="">All Topics</option>
          {topics?.map((t) => (
            <option key={t.id} value={t.id}>{t.name_en}</option>
          ))}
        </select>

        <select
          name="question_type"
          defaultValue={questionType}
          className="px-3.5 py-2 border border-[#E4E8F0] rounded-lg text-sm bg-white focus:border-[#003580] focus:ring-3 focus:ring-[#003580]/10 outline-none transition"
        >
          <option value="">All Types</option>
          {QUESTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <select
          name="is_active"
          defaultValue={isActive}
          className="px-3.5 py-2 border border-[#E4E8F0] rounded-lg text-sm bg-white focus:border-[#003580] focus:ring-3 focus:ring-[#003580]/10 outline-none transition"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#003580] hover:bg-[#00276B] active:bg-[#001F52] transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/></svg>
          Search
        </button>
      </form>

      <div className="bg-white border border-[#E4E8F0] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F1F4F9] border-b border-[#E4E8F0]">
              <th className="text-left px-4 py-3 text-xs font-semibold tracking-wide uppercase text-[#64748B]">
                Prompt
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold tracking-wide uppercase text-[#64748B]">
                Department
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold tracking-wide uppercase text-[#64748B]">
                Topic
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold tracking-wide uppercase text-[#64748B]">
                Type
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold tracking-wide uppercase text-[#64748B]">
                Source
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold tracking-wide uppercase text-[#64748B]">
                Status
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold tracking-wide uppercase text-[#64748B]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {questions?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <div className="text-[#94A3B8]">
                    <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                    <p className="text-sm font-medium">No questions found</p>
                    <p className="text-xs mt-1">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            )}
            {questions?.map((q, i) => (
              <tr key={q.id} className={`border-b border-[#E4E8F0] last:border-b-0 hover:bg-[#F7F8FC] transition ${i % 2 === 0 ? "bg-white" : "bg-[#FAFBFC]"}`}>
                <td className="px-4 py-3 max-w-xs">
                  <div className="truncate font-medium text-[#1A202C]">
                    {q.prompt_en}
                  </div>
                  {q.source_label && (
                    <div className="text-xs text-[#94A3B8] mt-0.5">
                      {q.source_label}{q.source_year ? ` ${q.source_year}` : ""}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-[#64748B] text-xs">
                  {(q.department as { name_en: string } | null)?.name_en ?? "—"}
                </td>
                <td className="px-4 py-3 text-[#64748B] text-xs">
                  {(q.topic as { name_en: string } | null)?.name_en ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${typeBadge[q.question_type] || ""}`}>
                    {typeLabel[q.question_type] || q.question_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[#64748B]">
                  {q.source_label || "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${q.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${q.is_active ? "bg-green-500" : "bg-red-500"}`} />
                    {q.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/questions/${q.id}/edit`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#003580] hover:bg-[#003580]/5 border border-transparent hover:border-[#003580]/10 transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 && (
            <Link
              href={`/admin/questions?${buildQuery(sp, { page: String(page - 1) })}`}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:text-[#003580] border border-[#E4E8F0] hover:border-[#003580] transition"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-[#64748B] px-3">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/questions?${buildQuery(sp, { page: String(page + 1) })}`}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:text-[#003580] border border-[#E4E8F0] hover:border-[#003580] transition"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
