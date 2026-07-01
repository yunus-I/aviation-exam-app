import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function AdminDashboard() {
  const supabase = getSupabaseAdminClient();

  const [totalQuestions, totalBanks, totalExamSets, totalCandidates, questionsByDept, allDepts, attemptsToday] =
    await Promise.all([
      supabase.from("questions").select("*", { count: "exact", head: true }).then((r) => r.count ?? 0),
      supabase.from("question_banks").select("*", { count: "exact", head: true }).then((r) => r.count ?? 0),
      supabase.from("exam_sets").select("*", { count: "exact", head: true }).then((r) => r.count ?? 0),
      supabase.from("candidates").select("*", { count: "exact", head: true }).then((r) => r.count ?? 0),
      supabase.from("questions").select("department_id").then((r) => r.data ?? []),
      supabase.from("departments").select("id, name_en").then((r) => r.data ?? []),
      supabase
        .from("exam_attempts")
        .select("id, status, created_at")
        .gte("created_at", new Date(Date.now() - 86400000).toISOString())
        .order("created_at", { ascending: false })
        .limit(10)
        .then((r) => r.data ?? []),
    ]);

  const deptMap = new Map(allDepts.map((d: any) => [d.id, d.name_en]));
  const raw: Record<string, number> = {};
  questionsByDept.forEach((q: any) => {
    const key = q.department_id || "uncategorized";
    raw[key] = (raw[key] || 0) + 1;
  });
  const deptBreakdown = Object.entries(raw)
    .map(([id, count]) => ({ name: deptMap.get(id) || "Uncategorized", count }))
    .sort((a, b) => b.count - a.count);

  const activeAttempts = attemptsToday.filter((a: any) => a.status === "in_progress").length;
  const submittedToday = attemptsToday.filter(
    (a: any) => a.status === "submitted" || a.status === "auto_submitted",
  ).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#003580]">Dashboard</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Overview of the exam question bank system
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-[#E4E8F0] rounded-xl p-5">
          <div className="text-xs font-semibold tracking-wide uppercase text-[#94A3B8] mb-2">Questions</div>
          <div className="text-3xl font-extrabold text-[#003580]">{totalQuestions.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-[#E4E8F0] rounded-xl p-5">
          <div className="text-xs font-semibold tracking-wide uppercase text-[#94A3B8] mb-2">Question Banks</div>
          <div className="text-3xl font-extrabold text-[#F5A623]">{totalBanks.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-[#E4E8F0] rounded-xl p-5">
          <div className="text-xs font-semibold tracking-wide uppercase text-[#94A3B8] mb-2">Exam Sets</div>
          <div className="text-3xl font-extrabold text-[#003580]">{totalExamSets.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-[#E4E8F0] rounded-xl p-5">
          <div className="text-xs font-semibold tracking-wide uppercase text-[#94A3B8] mb-2">Candidates</div>
          <div className="text-3xl font-extrabold text-[#F5A623]">{totalCandidates.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E4E8F0] rounded-xl p-6">
          <h2 className="text-sm font-bold text-[#003580] tracking-wide uppercase mb-4">
            Questions by Department
          </h2>
          <div className="space-y-3">
            {deptBreakdown.length === 0 && (
              <p className="text-sm text-[#94A3B8]">No data yet.</p>
            )}
            {deptBreakdown.map(({ name, count }) => {
              const pct = totalQuestions ? (count / totalQuestions) * 100 : 0;
              return (
                <div key={name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-[#1A202C]">{name}</span>
                    <span className="text-[#64748B]">{count.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-[#E4E8F0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#003580] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-[#E4E8F0] rounded-xl p-6">
          <h2 className="text-sm font-bold text-[#003580] tracking-wide uppercase mb-4">
            Recent Activity (24h)
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[#E4E8F0]">
              <span className="text-sm text-[#1A202C]">Attempts in progress</span>
              <span className="text-sm font-semibold text-[#003580]">{activeAttempts}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#E4E8F0]">
              <span className="text-sm text-[#1A202C]">Submitted today</span>
              <span className="text-sm font-semibold text-[#003580]">{submittedToday}</span>
            </div>
          </div>

          {attemptsToday.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase text-[#94A3B8] mb-2">Latest</h3>
              <div className="space-y-1">
                {attemptsToday.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between text-xs text-[#64748B]">
                    <span className="truncate">{a.id.slice(0, 8)}…</span>
                    <span className={`font-medium ${
                      a.status === "in_progress" ? "text-blue-600" :
                      a.status === "submitted" ? "text-green-600" : "text-[#94A3B8]"
                    }`}>
                      {a.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
