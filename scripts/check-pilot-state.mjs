import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envText = readFileSync(".env.local", "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const PILOT_DEPT_ID = "20731ecd-b9c7-4d41-a5aa-f0e3d5663898";

async function main() {
  const { data: examSets } = await supabase
    .from("exam_sets")
    .select("id, slug, title_en, mode, is_published, total_questions")
    .eq("department_id", PILOT_DEPT_ID);

  console.log("=== Pilot Exam Sets ===");
  for (const es of examSets || []) {
    const { count } = await supabase
      .from("exam_set_questions")
      .select("id", { count: "exact", head: true })
      .eq("exam_set_id", es.id);
    console.log(`  ${es.slug} | ${es.title_en} | mode=${es.mode} | published=${es.is_published} | linked=${count} | total_questions_col=${es.total_questions}`);
  }

  const { count: totalQuestions } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("department_id", PILOT_DEPT_ID);
  console.log(`\nTotal pilot questions in DB: ${totalQuestions}`);

  // Check which questions are NOT linked to any exam set
  const { data: allPilotQ } = await supabase
    .from("questions")
    .select("id")
    .eq("department_id", PILOT_DEPT_ID);
  
  const { data: allLinks } = await supabase
    .from("exam_set_questions")
    .select("question_id")
    .in("question_id", allPilotQ?.map(q => q.id) || []);

  const linkedIds = new Set(allLinks?.map(l => l.question_id) || []);
  const unlinked = allPilotQ?.filter(q => !linkedIds.has(q.id)) || [];
  console.log(`Questions linked to an exam set: ${linkedIds.size}`);
  console.log(`Questions NOT linked to any exam set: ${unlinked.length}`);
}

main().catch(console.error);
