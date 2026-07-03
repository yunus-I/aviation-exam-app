import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { DEPTS, isValidDept, type DeptSlug } from "@/lib/admin/constants";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { DeptQuestionsClient } from "./dept-questions-client";

interface Props {
  params: Promise<{ dept: string }>;
  searchParams: Promise<{ page?: string; search?: string }>;
}

const PAGE_SIZE = 50;

const typeLabel: Record<string, string> = { single_choice: "SC", multiple_choice: "MC", true_false: "TF" };

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

  const [{ data: topicsData }, { data: questionsData, count: total }] = await Promise.all([
    supabase.from("topics").select("id, slug, name_en").order("name_en"),
    (() => {
      let qb = supabase
        .from("questions")
        .select(`id, question_num, question_type, prompt_en, explanation_en, created_at, topic_id, department_id, topic:topics(slug, name_en)`, { count: "exact" })
        .eq("department_id", deptInfo.dbDeptId);
      if (search) qb = qb.or(`prompt_en.ilike.%${search}%`);
      return qb.order("question_num", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1);
    })(),
  ]);

  const questions = (questionsData as any[]) ?? [];
  const totalPages = Math.ceil((total ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A202C] tracking-tight">{deptInfo.nameEn}</h1>
          <p className="text-sm text-[#64748B] mt-1">{total ?? 0} question{(total ?? 0) !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href={`/admin/${dept}/new`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#003580] hover:bg-[#00276B] active:scale-[0.98] transition-all duration-150 shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          New Question
        </Link>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-md flex items-center gap-2 px-3.5 py-2.5 bg-white border border-[#E4E8F0] rounded-xl text-sm focus-within:border-[#003580] focus-within:ring-2 focus-within:ring-[#003580]/10 transition">
          <Search className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
          <form className="flex-1 min-w-0" method="GET">
            <input name="search" defaultValue={search} placeholder="Search questions..." className="w-full bg-transparent outline-none text-[#1A202C] placeholder:text-[#94A3B8]" />
          </form>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#64748B] bg-white border border-[#E4E8F0] hover:bg-[#F7F8FC] hover:text-[#1A202C] transition">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
        {search && (
          <Link href={`/admin/${dept}`} className="text-sm font-semibold text-[#64748B] hover:text-[#1A202C] transition px-3 py-2">
            Clear
          </Link>
        )}
      </div>

      {/* Table */}
      <DeptQuestionsClient
        dept={dept}
        questions={questions}
        totalPages={totalPages}
        page={page}
        search={search}
        typeLabel={typeLabel}
      />
    </div>
  );
}
