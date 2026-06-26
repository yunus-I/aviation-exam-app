const { createClient } = require("@supabase/supabase-js");
const { readFileSync, existsSync } = require("fs");
const { resolve } = require("path");

const projectDir = process.cwd();
const envPath = resolve(projectDir, ".env");
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  const args = process.argv.slice(2);
  const filePath = args[0] || "import-payload.json";
  const adminTelegramId = args[1] || "5827966050";

  const payload = JSON.parse(readFileSync(resolve(projectDir, filePath), "utf-8"));

  // Admin check
  const adminCheck = await supabase
    .from("admin_accounts")
    .select("id")
    .eq("telegram_user_id", Number(adminTelegramId))
    .single();

  if (adminCheck.error) {
    console.error("Admin lookup failed:", adminCheck.error);
    process.exit(1);
  }
  const adminId = adminCheck.data.id;
  console.log("Admin verified:", adminId);

  // Department lookups
  const deptByCode = async (code) => {
    const r = await supabase.from("departments").select("id").eq("code", code).single();
    if (r.error) throw r.error;
    return r.data.id;
  };
  const topicBySlug = async (slug) => {
    if (!slug) return null;
    const r = await supabase.from("topics").select("id").eq("slug", slug).single();
    if (r.error && r.error.code !== "PGRST116") throw r.error;
    return r.data?.id ?? null;
  };

  const bankDeptId = await deptByCode(payload.questionBank.departmentCode);
  const bankTopicId = await topicBySlug(payload.questionBank.topicSlug);
  const examDeptId = await deptByCode(payload.examSet.departmentCode);
  const examTopicId = await topicBySlug(payload.examSet.topicSlug);
  const questionTopicId = await topicBySlug(payload.questions[0]?.topicSlug);

  // Upsert question bank
  const bank = await supabase.from("question_banks").upsert({
    import_key: payload.questionBank.key,
    slug: payload.questionBank.slug,
    title_en: payload.questionBank.title,
    description_en: payload.questionBank.description ?? null,
    department_id: bankDeptId,
    topic_id: bankTopicId,
    is_active: true,
  }, { onConflict: "import_key" }).select("id").single();

  if (bank.error) { console.error("Bank upsert failed:", bank.error); process.exit(1); }
  console.log("Question bank ready:", bank.data.id);

  // Upsert exam set
  const examSet = await supabase.from("exam_sets").upsert({
    import_key: payload.examSet.key,
    slug: payload.examSet.slug,
    title_en: payload.examSet.title,
    description_en: payload.examSet.description ?? null,
    department_id: examDeptId,
    topic_id: examTopicId,
    mode: payload.examSet.mode,
    duration_minutes: payload.examSet.durationMinutes,
    is_published: payload.examSet.published ?? true,
    published_at: payload.examSet.published === false ? null : new Date().toISOString(),
    created_by_admin_id: adminId,
  }, { onConflict: "import_key" }).select("id").single();

  if (examSet.error) { console.error("ExamSet upsert failed:", examSet.error); process.exit(1); }
  console.log("Exam set ready:", examSet.data.id);

  // Delete old exam set question links
  await supabase.from("exam_set_questions").delete().eq("exam_set_id", examSet.data.id);

  // Import questions
  for (let i = 0; i < payload.questions.length; i++) {
    const q = payload.questions[i];
    const qtId = await topicBySlug(q.topicSlug);

    const qResult = await supabase.from("questions").upsert({
      import_key: q.key,
      question_bank_id: bank.data.id,
      department_id: examDeptId,
      topic_id: qtId ?? examTopicId,
      question_type: q.type,
      prompt_en: q.prompt,
      explanation_en: q.explanation ?? null,
      is_active: true,
      created_by_admin_id: adminId,
    }, { onConflict: "import_key" }).select("id").single();

    if (qResult.error) { console.error(`Question ${q.key} failed:`, qResult.error); process.exit(1); }
    const questionId = qResult.data.id;

    // Delete old options + media
    await supabase.from("question_options").delete().eq("question_id", questionId);
    await supabase.from("question_media").delete().eq("question_id", questionId);

    // Insert options
    const optsResult = await supabase.from("question_options").insert(
      q.options.map((opt, idx) => ({
        question_id: questionId,
        option_key: opt.key,
        option_text_en: opt.text,
        is_correct: opt.isCorrect,
        sort_order: idx + 1,
      }))
    );
    if (optsResult.error) { console.error(`Options for ${q.key} failed:`, optsResult.error); process.exit(1); }

    // Handle image
    if (q.imageStoragePath) {
      const mediaResult = await supabase.from("question_media").insert({
        question_id: questionId,
        storage_path: q.imageStoragePath,
        sort_order: 1,
      });
      if (mediaResult.error) { console.error(`Media for ${q.key} failed:`, mediaResult.error); process.exit(1); }
    }

    // Link to exam set
    const linkResult = await supabase.from("exam_set_questions").insert({
      exam_set_id: examSet.data.id,
      question_id: questionId,
      sort_order: i + 1,
    });
    if (linkResult.error) { console.error(`Link for ${q.key} failed:`, linkResult.error); process.exit(1); }
  }

  // Update question count
  await supabase.from("exam_sets").update({ total_questions: payload.questions.length }).eq("id", examSet.data.id);

  console.log(`\nImported ${payload.questions.length} questions into exam set ${examSet.data.id}`);
}

main().catch(err => {
  console.error("Import failed:", err);
  process.exit(1);
});
