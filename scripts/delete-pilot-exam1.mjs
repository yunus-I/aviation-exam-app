import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envText = readFileSync(".env.local", "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
console.log("URL:", url?.substring(0, 30));
console.log("KEY present:", !!key);

const supabase = createClient(url, key);

const PILOT_DEPT_ID = "20731ecd-b9c7-4d41-a5aa-f0e3d5663898";

async function main() {
  // Find exam sets for pilot with "exam-1" in slug
  const { data: examSets } = await supabase
    .from("exam_sets")
    .select("id, slug, title_en")
    .eq("department_id", PILOT_DEPT_ID);

  console.log("Pilot exam sets:", examSets?.map(e => `${e.slug} (${e.id})`));

  const exam1Sets = examSets?.filter(e =>
    e.slug.includes("exam-1") || e.slug.includes("exam1") || e.title_en?.toLowerCase().includes("exam 1")
  );

  if (!exam1Sets?.length) {
    console.log("No exam 1 sets found for pilot");
    return;
  }

  for (const es of exam1Sets) {
    console.log(`\nProcessing: ${es.title_en} (${es.slug})`);

    // Get questions linked to this exam set
    const { data: links } = await supabase
      .from("exam_set_questions")
      .select("id, question_id")
      .eq("exam_set_id", es.id);

    console.log(`Found ${links?.length || 0} linked questions`);

    if (!links?.length) continue;

    const questionIds = links.map(l => l.question_id);

    // Delete exam_set_questions first
    const { error: delLinkErr } = await supabase
      .from("exam_set_questions")
      .delete()
      .eq("exam_set_id", es.id);

    if (delLinkErr) {
      console.error("Error deleting links:", delLinkErr);
      continue;
    }
    console.log(`Deleted ${links.length} exam_set_questions links`);

    // Delete question_options for these questions
    const { error: delOptsErr } = await supabase
      .from("question_options")
      .delete()
      .in("question_id", questionIds);
    console.log(`Deleted question_options: ${delOptsErr?.message || "ok"}`);

    // Delete question_media
    const { error: delMediaErr } = await supabase
      .from("question_media")
      .delete()
      .in("question_id", questionIds);
    console.log(`Deleted question_media: ${delMediaErr?.message || "ok"}`);

    // Delete the questions
    const { error: delQErr } = await supabase
      .from("questions")
      .delete()
      .in("id", questionIds);
    console.log(`Deleted ${questionIds.length} questions: ${delQErr?.message || "ok"}`);
  }

  console.log("\nDone!");
}

main().catch(console.error);
