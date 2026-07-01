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
          <h1 className="text-2xl font-bold text-[#003580]">Questions</h1>
          <p className="text-sm text-[#64748B] mt-1">
            {total ?? 0} question{(total ?? 0) !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/admin/questions/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#003580] hover:bg-[#00276B] transition shadow-sm"
        >
          + New Question
        </Link>
      </div>

      <form className="bg-white border border-[#E4E8F0] rounded-xl p-4 mb-6 flex flex-wrap gap-3">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search prompt, source..."
          className="flex-1 min-w-[200px] px-3.5 py-2 border border-[#E4E8F0] rounded-lg text-sm focus:border-[#003580] focus:ring-3 focus:ring-[#003580]/10 outline-none transition"
        />

        <select
          name="department_id"
          defaultValue={departmentId}
          className="px-3.5 py-2 border border-[#E4E8F0] rounded-lg text-sm bg-white focus:border-[#003580] outline-none transition"
        >
          <option value="">All Departments</option>
          {departments?.map((d) => (
            <option key={d.id} value={d.id}>{d.name_en}</option>
          ))}
        </select>

        <select
          name="topic_id"
          defaultValue={topicId}
          className="px-3.5 py-2 border border-[#E4E8F0] rounded-lg text-sm bg-white focus:border-[#003580] outline-none transition"
        >
          <option value="">All Topics</option>
          {topics?.map((t) => (
            <option key={t.id} value={t.id}>{t.name_en}</option>
          ))}
        </select>

        <select
          name="question_type"
          defaultValue={questionType}
          className="px-3.5 py-2 border border-[#E4E8F0] rounded-lg text-sm bg-white focus:border-[#003580] outline-none transition"
        >
          <option value="">All Types</option>
          {QUESTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <select
          name="is_active"
          defaultValue={isActive}
          className="px-3.5 py-2 border border-[#E4E8F0] rounded-lg text-sm bg-white focus:border-[#003580] outline-none transition"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#003580] hover:bg-[#00276B] transition"
        >
          Search
        </button>
      </form>

      <div className="bg-white border border-[#E4E8F0] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F7F8FC] border-b border-[#E4E8F0]">
              <th className="text-left px-4 py-3 text-xs font-semibold tracking-wide uppercase text-[#94A3B8]">
                Prompt
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold tracking-wide uppercase text-[#94A3B8]">
                Department
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold tracking-wide uppercase text-[#94A3B8]">
                Topic
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold tracking-wide uppercase text-[#94A3B8]">
                Type
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold tracking-wide uppercase text-[#94A3B8]">
                Source
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold tracking-wide uppercase text-[#94A3B8]">
                Status
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold tracking-wide uppercase text-[#94A3B8]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {questions?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-[#94A3B8]">
                  No questions found.
                </td>
              </tr>
            )}
            {questions?.map((q) => (
              <tr key={q.id} className="border-b border-[#E4E8F0] last:border-b-0 hover:bg-[#F7F8FC] transition">
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
                <td className="px-4 py-3 text-[#64748B]">
                  {(q.department as { name_en: string } | null)?.name_en ?? "—"}
                </td>
                <td className="px-4 py-3 text-[#64748B]">
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
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${q.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {q.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/questions/${q.id}/edit`}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#003580] hover:bg-[#003580]/5 transition"
                    >
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
