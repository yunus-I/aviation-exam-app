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

async function deleteQuestions(questionIds) {
  if (!questionIds.length) return;
  const { error: e1 } = await supabase.from("exam_set_questions").delete().in("question_id", questionIds);
  console.log(`  exam_set_questions: ${e1?.message || "ok"}`);
  const { error: e2 } = await supabase.from("question_options").delete().in("question_id", questionIds);
  console.log(`  question_options: ${e2?.message || "ok"}`);
  const { error: e3 } = await supabase.from("question_media").delete().in("question_id", questionIds);
  console.log(`  question_media: ${e3?.message || "ok"}`);
  const { error: e4 } = await supabase.from("questions").delete().in("id", questionIds);
  console.log(`  questions (${questionIds.length}): ${e4?.message || "ok"}`);
}

async function main() {
  // Get all pilot questions
  const { data: allQuestions } = await supabase
    .from("questions")
    .select("id, topic_id, prompt_en")
    .eq("department_id", PILOT_DEPT_ID);

  console.log(`Total pilot questions: ${allQuestions?.length || 0}`);

  // Find Practice 1-4 topic IDs
  const { data: topics } = await supabase
    .from("topics")
    .select("id, name_en, slug");

  const practiceSlugs = ["practice-1", "practice-2", "practice-3", "practice-4"];
  const practiceNames = ["Practice 1", "Practice 2", "Practice 3", "Practice 4"];
  const practiceTopicIds = topics
    ?.filter(t => practiceSlugs.includes(t.slug) || practiceNames.includes(t.name_en))
    .map(t => t.id) || [];

  console.log(`Practice topic IDs: ${practiceTopicIds}`);

  // Get exam sets for pilot
  const { data: examSets } = await supabase
    .from("exam_sets")
    .select("id, slug, title_en")
    .eq("department_id", PILOT_DEPT_ID);

  console.log(`\nPilot exam sets:`);
  for (const es of examSets || []) {
    console.log(`  ${es.slug} - ${es.title_en} (${es.id})`);
  }

  const examSetIds = examSets?.map(e => e.id) || [];

  // Get questions linked to these exam sets
  const { data: examLinks } = await supabase
    .from("exam_set_questions")
    .select("question_id, exam_set_id")
    .in("exam_set_id", examSetIds);

  const examQuestionIds = new Set(examLinks?.map(l => l.question_id) || []);
  console.log(`\nQuestions in exam sets: ${examQuestionIds.size}`);

  // Get questions with Practice topics
  const practiceQuestions = allQuestions?.filter(q => practiceTopicIds.includes(q.topic_id)) || [];
  console.log(`Questions with Practice topics: ${practiceQuestions.length}`);

  // Combine both sets
  const toDelete = new Set([...examQuestionIds, ...practiceQuestions.map(q => q.id)]);
  console.log(`\nTotal questions to delete: ${toDelete.size}`);

  if (toDelete.size === 0) {
    console.log("Nothing to delete");
    return;
  }

  await deleteQuestions([...toDelete]);
  console.log("\nDone!");
}

main().catch(console.error);
